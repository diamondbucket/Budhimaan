from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import time
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict, Any, Optional, Tuple

# Initialize Flask app
app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Constants
GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"
PDF_DIR = "knowledge_base"
USER_DATA_FILE = "user_profile.json"
ENDPOINT = "https://models.inference.ai.azure.com"

# Initialize Azure AI Inference client
github_client = ChatCompletionsClient(
    endpoint=ENDPOINT,
    credential=AzureKeyCredential(GITHUB_TOKEN),
)

# Create vector database from PDFs - keeping your existing implementation
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

# Function to call GitHub models with Azure AI Inference SDK
def call_github_model(messages, model_name="gpt-4o-mini", temperature=0.7, max_tokens=1000):
    try:
        # Convert messages to the format expected by Azure AI Inference SDK
        azure_messages = []
        for msg in messages:
            if msg["role"] == "system":
                azure_messages.append(SystemMessage(content=msg["content"]))
            elif msg["role"] == "user":
                azure_messages.append(UserMessage(content=msg["content"]))
        
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

# Generate responses locally when API is unavailable
def generate_local_response(messages):
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

# Generate lifestyle plan using LLM and RAG
def generate_lifestyle_plan(user_data, vector_store):
    # Create retriever from vector store
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    
    # Create user profile summary
    user_profile = json.dumps(user_data, indent=2)
    
    # Query the knowledge base for relevant information
    query = f"AYUSH lifestyle recommendations for a person with the following profile: {user_profile}"
    retrieved_docs = retriever.get_relevant_documents(query)
    
    # Extract relevant content from retrieved documents
    knowledge_context = "\n\n".join([doc.page_content for doc in retrieved_docs])
    
    # Create prompt for LLM
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

    # Generate lifestyle plan using LLM
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

# Initialize vector store at startup
vector_store = None

@app.before_first_request
def initialize():
    global vector_store
    vector_store = create_vector_db()

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "vector_store": vector_store is not None})

@app.route('/api/collect-info', methods=['POST'])
def collect_info():
    data = request.json
    basic_info = data.get('basicInfo', {})
    
    # Generate follow-up questions based on basic info
    system_prompt = """You are an expert AYUSH practitioner specializing in Ayurveda, Yoga, Unani, Siddha, and Homeopathy.
Based on the initial user information, generate 8-10 personalized follow-up questions that will help you understand their constitution (prakriti), imbalances (vikriti), and lifestyle factors.
Tailor your questions to their specific health concerns, age, and gender.
Your questions should help gather information about their diet, sleep patterns, stress levels, exercise habits, and any specific AYUSH-related information.
Format your response as a JSON array of questions only."""
    
    user_prompt = f"""Initial user information:
{json.dumps(basic_info, indent=2)}

Generate personalized follow-up questions to better understand this individual from an AYUSH perspective."""
    
    # Get personalized questions
    follow_up_questions_json = call_github_model(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
                model_name="gpt-4o-mini",
        temperature=0.7,
        max_tokens=2000
    )
    
    try:
        # Try to parse the response as JSON
        follow_up_questions = json.loads(follow_up_questions_json)
    except:
        # Fallback to a simple string response if JSON parsing fails
        follow_up_questions = follow_up_questions_json
    
    return jsonify({
        "success": True,
        "followUpQuestions": follow_up_questions
    })

@app.route('/api/submit-responses', methods=['POST'])
def submit_responses():
    data = request.json
    responses = data.get('responses', [])
    
    # Process responses to create structured user profile
    prompt = "Based on the following user responses, create a structured profile for AYUSH lifestyle planning:\n\n"
    for resp in responses:
        prompt += f"Question: {resp.get('question', '')}\nAnswer: {resp.get('answer', '')}\n\n"
    prompt += "Create a detailed JSON structure with relevant fields extracted from these responses, including prakriti assessment, dosha imbalances, and lifestyle factors."
    
    # Use model to analyze responses
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
        
        # Save user data to file
        with open(USER_DATA_FILE, 'w') as f:
            json.dump(user_data, f, indent=2)
        
        return jsonify({
            "success": True,
            "userProfile": user_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "rawResponse": structured_data_response
        })

@app.route('/api/generate-plan', methods=['POST'])
def generate_plan():
    global vector_store
    
    data = request.json
    user_data = data.get('userProfile', {})
    
    if not vector_store:
        vector_store = create_vector_db()
        if not vector_store:
            return jsonify({
                "success": False,
                "error": "Could not initialize vector database. Please add PDF files to the knowledge_base directory."
            })
    
    try:
        # Generate lifestyle plan
        lifestyle_plan = generate_lifestyle_plan(user_data, vector_store)
        
        return jsonify({
            "success": True,
            "lifestylePlan": lifestyle_plan
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route('/api/ask-question', methods=['POST'])
def ask_question():
    data = request.json
    user_question = data.get('question', '')
    user_data = data.get('userProfile', {})
    lifestyle_plan = data.get('lifestylePlan', '')
    
    # Process follow-up questions
    prompt = f"""
User Profile: {json.dumps(user_data)}

Lifestyle Plan: {lifestyle_plan}

User Question: {user_question}

Please provide a helpful response to the user's question about their AYUSH lifestyle plan.
"""
    
    try:
        response = call_github_model(
            messages=[
                {"role": "system", "content": "You are an AYUSH lifestyle coach assistant. Answer questions about the user's lifestyle plan based on Ayurveda, Yoga, Unani, Siddha, and Homeopathy principles."},
                {"role": "user", "content": prompt}
            ],
            model_name="gpt-4o-mini",
            temperature=0.7,
            max_tokens=1000
        )
        
        return jsonify({
            "success": True,
            "response": response
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

# Serve React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)