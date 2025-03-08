import os
import json
import time
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate


GITHUB_TOKEN = "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"
PDF_DIR = "knowledge_base"
USER_DATA_FILE = "user_profile.json"
ENDPOINT = "https://models.inference.ai.azure.com"

# Initialize Azure AI Inference client
github_client = ChatCompletionsClient(
    endpoint=ENDPOINT,
    credential=AzureKeyCredential(GITHUB_TOKEN),
)

# Create vector database from PDFs
def create_vector_db():
    # Create directory for knowledge base if it doesn't exist
    os.makedirs(PDF_DIR, exist_ok=True)
    
    # Check if we have PDFs to process
    pdf_files = [f for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]
    
    if not pdf_files:
        print(f"No PDF files found in {PDF_DIR}. Please add your knowledge base PDFs.")
        return None
    
    # Load and process PDFs
    documents = []
    for pdf in pdf_files:
        loader = PyPDFLoader(os.path.join(PDF_DIR, pdf))
        documents.extend(loader.load())
    
    # Split documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_documents(documents)
    
    # Create a custom embedding function compatible with Chroma
    from sentence_transformers import SentenceTransformer
    import numpy as np
    
    class CustomEmbeddingFunction:
        def __init__(self, model_name="all-MiniLM-L6-v2"):
            self.model = SentenceTransformer(model_name)
            
        def __call__(self, input):
            # This matches the expected signature for Chroma's EmbeddingFunction
            embeddings = self.model.encode(input, convert_to_numpy=True)
            return embeddings.tolist()
    
    # Initialize Chroma directly
    import chromadb
    from chromadb.config import Settings
    
    # Create a persistent client
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    
    # Create or get collection
    embedding_function = CustomEmbeddingFunction()
    collection = chroma_client.get_or_create_collection(
        name="ayush_knowledge_base",
        embedding_function=embedding_function
    )
    
    # Add documents to collection
    texts = [doc.page_content for doc in chunks]
    metadatas = [doc.metadata for doc in chunks]
    ids = [f"doc_{i}" for i in range(len(chunks))]
    
    # Add in batches to avoid memory issues
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        end_idx = min(i + batch_size, len(texts))
        collection.add(
            documents=texts[i:end_idx],
            metadatas=metadatas[i:end_idx],
            ids=ids[i:end_idx]
        )
    
    # Create a custom wrapper for LangChain compatibility
    from langchain.vectorstores.base import VectorStore
    from langchain.docstore.document import Document
    from typing import List, Dict, Any, Optional, Tuple
    
    class ChromaWrapper(VectorStore):
        def __init__(self, client, collection_name, embedding_function):
            self.client = client
            self.collection_name = collection_name
            self.collection = client.get_collection(collection_name)
            self.embedding_function = embedding_function
        
        def add_documents(self, documents: List[Document]):
            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]
            ids = [f"langchain_{i}" for i in range(len(documents))]
            self.collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
        
        def add_texts(self, texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None, **kwargs):
            """Add texts to the vectorstore."""
            if metadatas is None:
                metadatas = [{} for _ in texts]
            ids = [f"langchain_text_{i}" for i in range(len(texts))]
            self.collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            return ids
        
        @classmethod
        def from_texts(cls, texts: List[str], embedding: Any, metadatas: Optional[List[Dict[str, Any]]] = None, **kwargs):
            """Create a ChromaWrapper from texts."""
            # This is just a placeholder implementation to satisfy the abstract method
            # In practice, you would create a new collection and add the texts
            raise NotImplementedError("This method is implemented only to satisfy the abstract class requirement")
        
        def similarity_search(self, query: str, k: int = 4) -> List[Document]:
            results = self.collection.query(
                query_texts=[query],
                n_results=k
            )
            
            documents = []
            for i in range(len(results['documents'][0])):
                doc = Document(
                    page_content=results['documents'][0][i],
                    metadata=results['metadatas'][0][i] if results['metadatas'][0] else {}
                )
                documents.append(doc)
            
            return documents
        
        def as_retriever(self, search_kwargs=None):
            # Try different import paths for VectorStoreRetriever
            try:
                # First try the new location
                from langchain_core.vectorstores.base import VectorStoreRetriever
            except ImportError:
                try:
                    # Then try the legacy location
                    from langchain_core.vectorstores.base import VectorStoreRetriever
                except ImportError:
                    # Create a simple retriever class if import fails
                    class SimpleRetriever:
                        def __init__(self, vectorstore, search_kwargs=None):
                            self.vectorstore = vectorstore
                            self.search_kwargs = search_kwargs or {}
                        
                        def get_relevant_documents(self, query):
                            return self.vectorstore.similarity_search(
                                query, 
                                k=self.search_kwargs.get("k", 4)
                            )
                    
                    search_kwargs = search_kwargs or {}
                    return SimpleRetriever(
                        vectorstore=self,
                        search_kwargs=search_kwargs
                    )
            
            search_kwargs = search_kwargs or {}
            
            # Create a direct retriever function that bypasses validation
            def get_relevant_documents(query):
                return self.similarity_search(
                    query, 
                    k=search_kwargs.get("k", 4)
                )
            
            # Create a simple object with the get_relevant_documents method
            class CustomRetriever:
                def __init__(self, func):
                    self.get_relevant_documents = func
            
            return CustomRetriever(get_relevant_documents)
    
    # Create our custom wrapper
    vector_store = ChromaWrapper(
        client=chroma_client,
        collection_name="ayush_knowledge_base",
        embedding_function=embedding_function
    )
    
    print(f"Created vector database with {len(chunks)} chunks from {len(pdf_files)} PDFs")
    return vector_store

# Updated function to call GitHub models with Azure AI Inference SDK
def call_github_model(messages, model_name="gpt-4o-mini", temperature=0.7, max_tokens=1000):
    try:
        # Convert messages to the format expected by Azure AI Inference SDK
        azure_messages = []
        for msg in messages:
            if msg["role"] == "system":
                azure_messages.append(SystemMessage(content=msg["content"]))
            elif msg["role"] == "user":
                azure_messages.append(UserMessage(content=msg["content"]))
            # Add assistant message handling if needed
        
        response = github_client.complete(
            messages=azure_messages,
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=1
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling {model_name}: {e}")
        
        # Check if it's an authentication error
        error_str = str(e)
        if "401" in error_str or "authentication" in error_str.lower():
            print("Authentication error detected. Using local fallback mode...")
            # Generate a reasonable response based on the messages without API
            return generate_local_response(messages)
        
        # Fallback to gpt-4o-mini if another model fails
        if model_name != "gpt-4o-mini":
            print(f"Falling back to gpt-4o-mini...")
            return call_github_model(messages, "gpt-4o-mini", temperature, max_tokens)
        else:
            return "I apologize, but I encountered an error processing your request. Please try again."

# Add this new function to generate responses locally without API
def generate_local_response(messages):
    """Generate responses locally when API is unavailable"""
    # Extract the user's message
    user_message = ""
    system_message = ""
    
    for msg in messages:
        if msg["role"] == "user":
            user_message = msg["content"]
        elif msg["role"] == "system":
            system_message = msg["content"]
    
    # Check for specific message types and generate appropriate responses
    if "generate personalized follow-up questions" in user_message.lower():
        return json.dumps([
            "What is your typical daily routine (waking time, sleeping time, meal times)?",
            "What is your current diet like? Please describe what you typically eat in a day.",
            "How would you describe your stress levels (low, moderate, high)?",
            "Do you exercise regularly? If yes, what type and how often?",
            "What are your main health goals or areas you'd like to improve?",
            "Have you tried any AYUSH practices before (Ayurveda, Yoga, Unani, Siddha, Homeopathy)?",
            "Do you have any dietary restrictions or preferences?",
            "How is your sleep quality and duration?",
            "What is your water intake per day?",
            "Are you currently taking any medications or supplements?"
        ])
    elif "create a structured profile" in user_message.lower():
        return json.dumps({
            "personal_info": {
                "name": "User",
                "age": "Not specified",
                "gender": "Not specified"
            },
            "prakriti_assessment": {
                "primary_dosha": "Unknown",
                "dosha_balance": "Needs professional assessment"
            },
            "lifestyle_factors": {
                "diet": "Based on user input",
                "sleep": "Based on user input",
                "exercise": "Based on user input",
                "stress_level": "Based on user input"
            },
            "health_concerns": "Based on user input",
            "recommendations": "Will be generated based on AYUSH principles"
        })
    elif "create a comprehensive, personalized AYUSH lifestyle plan" in user_message.lower():
        return """# Personalized AYUSH Lifestyle Plan

## Daily Routine Recommendations
- Wake up early (preferably before sunrise)
- Drink warm water in the morning
- Practice meditation for 10-15 minutes
- Follow regular meal times
- Sleep by 10 PM

## Diet Recommendations
- Focus on fresh, whole foods
- Include seasonal fruits and vegetables
- Avoid processed foods and excess sugar
- Stay hydrated throughout the day

## Exercise Recommendations
- Practice gentle yoga asanas daily
- Include pranayama (breathing exercises)
- Take regular walks in nature
- Maintain consistency rather than intensity

## Stress Management
- Practice mindfulness throughout the day
- Take short breaks during work
- Connect with nature regularly
- Maintain a gratitude journal

## Sleep Recommendations
- Establish a regular sleep schedule
- Avoid electronic devices before bedtime
- Create a calm sleeping environment
- Practice gentle stretching before sleep

This plan is based on general AYUSH principles. For more personalized recommendations, please consult with an AYUSH practitioner."""
    else:
        return "I'm currently operating in offline mode. I can help with basic AYUSH lifestyle recommendations, but for more personalized advice, please check your API connection or consult with an AYUSH practitioner."

# User information collection with adaptive questioning
def collect_user_info(vector_store=None):
    user_data = {}
    
    # Initial greeting
    print("🧘 AYUSH Lifestyle Coach 🌿")
    print("I'll help create a personalized lifestyle plan based on AYUSH principles.")
    print("Let's start by collecting some information about you.")
    
    # Initial basic questions
    basic_questions = [
        "What is your name?",
        "What is your age?",
        "What is your gender?",
        "What is your current weight (in kg) and height (in cm)?",
        "Do you have any existing health conditions or concerns?"
    ]
    
    # Ask basic questions and store responses
    responses = []
    for question in basic_questions:
        print(f"\n{question}")
        user_input = input("> ")
        responses.append({"question": question, "answer": user_input})
    
    # Use DeepSeek R1 to analyze initial responses and generate personalized follow-up questions
    initial_profile = "\n".join([f"Q: {r['question']}\nA: {r['answer']}" for r in responses])
    
    system_prompt = """You are an expert AYUSH practitioner specializing in Ayurveda, Yoga, Unani, Siddha, and Homeopathy.
Based on the initial user information, generate 8-10 personalized follow-up questions that will help you understand their constitution (prakriti), imbalances (vikriti), and lifestyle factors.
Tailor your questions to their specific health concerns, age, and gender.
Your questions should help gather information about their diet, sleep patterns, stress levels, exercise habits, and any specific AYUSH-related information.
Format your response as a JSON array of questions only."""
    
    user_prompt = f"""Initial user information:
{initial_profile}

Generate personalized follow-up questions to better understand this individual from an AYUSH perspective."""
    
    # Get personalized questions using DeepSeek R1
    follow_up_questions_json = call_github_model(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model_name="gpt-4o-mini",
        temperature=0.7,
        max_tokens=2000
    )
    
    # Parse the follow-up questions
    try:
        # Try to extract JSON if it's embedded in text
        if not follow_up_questions_json.strip().startswith('['):
            import re
            json_match = re.search(r'(\[.*\])', follow_up_questions_json, re.DOTALL)
            if json_match:
                follow_up_questions_json = json_match.group(1)
        
        follow_up_questions = json.loads(follow_up_questions_json)
        if not isinstance(follow_up_questions, list):
            raise ValueError("Expected a list of questions")
    except:
        # Fallback questions if JSON parsing fails
        print("Using default follow-up questions...")
        follow_up_questions = [
            "What is your typical daily routine (waking time, sleeping time, meal times)?",
            "What is your current diet like? Please describe what you typically eat in a day.",
            "How would you describe your stress levels (low, moderate, high)?",
            "Do you exercise regularly? If yes, what type and how often?",
            "What are your main health goals or areas you'd like to improve?",
            "Have you tried any AYUSH practices before (Ayurveda, Yoga, Unani, Siddha, Homeopathy)?",
            "Do you have any dietary restrictions or preferences?",
            "How is your sleep quality and duration?",
            "What is your water intake per day?",
            "Are you currently taking any medications or supplements?"
        ]
    
    # Ask personalized follow-up questions
    for question in follow_up_questions:
        if isinstance(question, dict) and 'question' in question:
            question = question['question']
        print(f"\n{question}")
        user_input = input("> ")
        responses.append({"question": question, "answer": user_input})
    
    # Process all responses with DeepSeek R1 to extract structured information
    prompt = "Based on the following user responses, create a structured profile for AYUSH lifestyle planning:\n\n"
    for resp in responses:
        prompt += f"Question: {resp['question']}\nAnswer: {resp['answer']}\n\n"
    prompt += "Create a detailed JSON structure with relevant fields extracted from these responses, including prakriti assessment, dosha imbalances, and lifestyle factors."
    
    # Use gpt-4o for deeper analysis of user profile
    structured_data_response = call_github_model(
        messages=[
            {"role": "system", "content": "You are an expert AYUSH practitioner who can analyze user information and create structured profiles based on Ayurvedic, Yoga, Unani, Siddha, and Homeopathy principles."},
            {"role": "user", "content": prompt}
        ],
        model_name="gpt-4o-mini",
        temperature=0.3,
        max_tokens=3000
    )
    
    # Parse the structured data
    try:
        # Try to extract JSON if it's embedded in text
        if not structured_data_response.strip().startswith('{'):
            import re
            json_match = re.search(r'(\{.*\})', structured_data_response, re.DOTALL)
            if json_match:
                structured_data_response = json_match.group(1)
        
        user_data = json.loads(structured_data_response)
    except:
        # Fallback if JSON parsing fails
        user_data = {"raw_responses": responses}
        user_data["analysis_text"] = structured_data_response
    
    # Save user data to file
    with open(USER_DATA_FILE, 'w') as f:
        json.dump(user_data, f, indent=2)
    
    print("\nThank you for providing your information. I'll now analyze it to create your personalized AYUSH lifestyle plan.")
    return user_data

# Generate lifestyle plan using DeepSeek R1 and RAG
def generate_lifestyle_plan(user_data, vector_store):
    # Load user data
    if isinstance(user_data, str) and os.path.exists(user_data):
        with open(user_data, 'r') as f:
            user_data = json.load(f)
    
    # Create retriever from vector store
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    
    # Create user profile summary
    user_profile = json.dumps(user_data, indent=2)
    
    # Query the knowledge base for relevant information
    query = f"AYUSH lifestyle recommendations for a person with the following profile: {user_profile}"
    retrieved_docs = retriever.get_relevant_documents(query)
    
    # Extract relevant content from retrieved documents
    knowledge_context = "\n\n".join([doc.page_content for doc in retrieved_docs])
    
    # Create prompt for DeepSeek R1
    system_prompt = """You are an expert AYUSH lifestyle coach with deep knowledge of Ayurveda, Yoga, Unani, Siddha, and Homeopathy.
Your task is to create a comprehensive, personalized lifestyle plan based on AYUSH principles.
Analyze the user's profile carefully and match it with the knowledge base information.
Provide specific, actionable recommendations that are tailored to the individual.
Include recommendations for:
1. Daily routine (dinacharya) based on their dosha type
2. Diet plan with specific foods to include/avoid
3. Exercise and yoga practices with specific asanas
4. Stress management techniques
5. Sleep hygiene recommendations
6. Herbal supplements or remedies if appropriate
7. Any specific AYUSH therapies that might benefit them

Your plan should be holistic, addressing mind, body, and spirit, and should be practical for the user to implement.
Cite specific AYUSH principles and practices in your recommendations."""

    user_prompt = f"""USER PROFILE:
{user_profile}

RELEVANT KNOWLEDGE BASE INFORMATION:
{knowledge_context}

Based on this information, create a comprehensive, personalized AYUSH lifestyle plan for this individual.
Be specific, practical, and thorough in your recommendations."""

    # Generate lifestyle plan using DeepSeek R1
    lifestyle_plan = call_github_model(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model_name="deepseek-r1",
        temperature=0.7,
        max_tokens=4000
    )
    
    return lifestyle_plan

# Interactive chat function
def chat_with_user(vector_store):
    user_data = None
    lifestyle_plan = None
    
    print("Welcome to AYUSH Lifestyle Coach!")
    print("Type 'exit' at any time to quit.")
    
    while True:
        if not user_data:
            print("\nI need to collect some information about you first.")
            user_data = collect_user_info(vector_store)
            continue
            
        if not lifestyle_plan:
            print("\nGenerating your personalized AYUSH lifestyle plan...")
            lifestyle_plan = generate_lifestyle_plan(user_data, vector_store)
            print("\n" + "="*50)
            print("YOUR PERSONALIZED AYUSH LIFESTYLE PLAN")
            print("="*50)
            print(lifestyle_plan)
            print("\nDo you have any questions about your plan? (Type 'exit' to quit)")
            continue
        
        user_input = input("\nYou: ")
        
        if user_input.lower() == 'exit':
            print("Thank you for using AYUSH Lifestyle Coach. Namaste! 🙏")
            break
        
        # Determine which model to use based on the question
        # Use DeepSeek R1 for complex questions about AYUSH principles
        if any(keyword in user_input.lower() for keyword in ['why', 'explain', 'how does', 'principle', 'dosha', 'ayurveda', 'yoga', 'unani', 'siddha', 'homeopathy']):
            model_to_use = "gpt-4o-mini"
        else:
            model_to_use = "gpt-4o-mini"
        
        # Process follow-up questions
        prompt = f"""
User Profile: {json.dumps(user_data)}

Lifestyle Plan: {lifestyle_plan}

User Question: {user_input}

Please provide a helpful response to the user's question about their AYUSH lifestyle plan.
"""
        
        response = call_github_model(
            messages=[
                {"role": "system", "content": "You are an AYUSH lifestyle coach assistant. Answer questions about the user's lifestyle plan based on Ayurveda, Yoga, Unani, Siddha, and Homeopathy principles."},
                {"role": "user", "content": prompt}
            ],
            model_name=model_to_use,
            temperature=0.7,
            max_tokens=1000
        )
        
        print("\nCoach:", response)

# Main function
def main():
    print("Initializing AYUSH Lifestyle Coach...")
    
    # Check for environment variables
    if not GITHUB_TOKEN:
        print("Error: GITHUB_TOKEN environment variable not set.")
        print("Please set it using:")
        print("  Windows: set GITHUB_TOKEN=your_token_here")
        print("  Linux/Mac: export GITHUB_TOKEN=your_token_here")
        return
    
    # Create vector database
    print("Setting up knowledge base...")
    vector_store = create_vector_db()
    
    if not vector_store:
        print("Could not initialize vector database. Please add PDF files to the knowledge_base directory.")
        return
    
    # Start chat interface
    chat_with_user(vector_store)

if __name__ == "__main__":
    main()