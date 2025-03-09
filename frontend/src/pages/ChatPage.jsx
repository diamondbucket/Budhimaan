import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserData } from '../contexts/UserDataContext';
import { collectInfo, submitResponses, generatePlan } from '../services/api';
import { FaArrowLeft, FaPaperPlane, FaSpinner, FaUser, FaRobot } from 'react-icons/fa';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const ChatPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { 
    setUserProfile, 
    responses, 
    setResponses, 
    addResponse, 
    setLifestylePlan,
    chatHistory,
    setChatHistory,
    addChatMessage,
    isLoading,
    setIsLoading
  } = useUserData();
  
  const [userInput, setUserInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [basicInfoCollected, setBasicInfoCollected] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [progress, setProgress] = useState(0);
  
  const messagesEndRef = useRef(null);
  
  // Calculate progress
  useEffect(() => {
    if (!basicInfoCollected) {
      if (name && !age && !gender) setProgress(10);
      else if (name && age && !gender) setProgress(20);
      else if (name && age && gender) setProgress(30);
    } else {
      const totalQuestions = followUpQuestions.length;
      const progressValue = totalQuestions > 0 
        ? 30 + (questionIndex / totalQuestions) * 70 
        : 30;
      setProgress(progressValue);
    }
  }, [name, age, gender, basicInfoCollected, questionIndex, followUpQuestions.length]);
  
  // Initial greeting based on category
  useEffect(() => {
    const categoryGreetings = {
      lifestyle: "Let's create a personalized lifestyle plan based on AYUSH principles.",
      health: "I'll help you address your health concerns using AYUSH approaches.",
      diet: "Let's develop a nutritional plan based on your constitution and AYUSH principles.",
      skin: "I'll recommend AYUSH-based skin care routines tailored to your needs."
    };
    
    const greeting = categoryGreetings[category] || "Welcome to your AYUSH consultation.";
    
    setChatHistory([
      { role: 'assistant', content: `Hello! I'm your AYUSH Lifestyle Coach. ${greeting}` },
      { role: 'assistant', content: "To get started, I'll need some basic information. What's your name?" }
    ]);
    
    setCurrentQuestion("What's your name?");
  }, [category, setChatHistory]);
  
  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Handle user input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    
    addChatMessage('user', userInput);
    setUserInput('');
    setIsLoading(true);
    
    try {
      // Basic info collection phase
      if (!basicInfoCollected) {
        if (currentQuestion.includes("name")) {
          setName(userInput);
          addChatMessage('assistant', `Nice to meet you, ${userInput}! How old are you?`);
          setCurrentQuestion("How old are you?");
        } else if (currentQuestion.includes("old")) {
          setAge(userInput);
          addChatMessage('assistant', "What is your gender?");
          setCurrentQuestion("What is your gender?");
        } else if (currentQuestion.includes("gender")) {
          setGender(userInput);
          
          // Collect follow-up questions based on basic info
          addChatMessage('assistant', "Thank you for providing your basic information. Now I'll ask some more specific questions to better understand your needs.");
          
          const basicInfo = {
            name,
            age,
            gender: userInput,
            category
          };
          
          const result = await collectInfo(basicInfo);
          if (result.success && Array.isArray(result.followUpQuestions)) {
            setFollowUpQuestions(result.followUpQuestions);
            setCurrentQuestion(result.followUpQuestions[0]);
            addChatMessage('assistant', result.followUpQuestions[0]);
          } else {
            // Fallback questions if API fails
            const fallbackQuestions = [
              "What is your typical daily routine?",
              "Do you have any existing health conditions?",
              "What is your current diet like?",
              "How would you describe your stress levels?",
              "Do you exercise regularly?",
              "What are your main health goals?"
            ];
            setFollowUpQuestions(fallbackQuestions);
            setCurrentQuestion(fallbackQuestions[0]);
            addChatMessage('assistant', fallbackQuestions[0]);
          }
          
          setBasicInfoCollected(true);
          setQuestionIndex(0);
        }
      } 
      // Follow-up questions phase
      else if (questionIndex < followUpQuestions.length) {
        // Save response
        addResponse(currentQuestion, userInput);
        
        // Move to next question or generate profile
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        
        if (nextIndex < followUpQuestions.length) {
          const nextQuestion = followUpQuestions[nextIndex];
          setCurrentQuestion(nextQuestion);
          addChatMessage('assistant', nextQuestion);
        } else {
          // All questions answered, generate profile
          addChatMessage('assistant', "Thank you for all this information! I'm now creating your personalized AYUSH profile and lifestyle plan. This will take a moment...");
          
          // Submit all responses to generate user profile
          const result = await submitResponses(responses);
          
          if (result.success && result.userProfile) {
            setUserProfile(result.userProfile);
            
            // Generate lifestyle plan
            addChatMessage('assistant', "Your profile has been created. Now generating your personalized lifestyle plan...");
            
            const planResult = await generatePlan(result.userProfile);
            
            if (planResult.success && planResult.lifestylePlan) {
              setLifestylePlan(planResult.lifestylePlan);
              
              addChatMessage('assistant', "Your personalized AYUSH lifestyle plan is ready!");
              addChatMessage('assistant', "Would you like to view your complete plan now?");
            } else {
              addChatMessage('assistant', "I encountered an issue generating your plan. Let's try a simpler approach.");
            }
          } else {
            addChatMessage('assistant', "I encountered an issue creating your profile. Let's try a different approach.");
          }
        }
      } 
      // Final confirmation and plan viewing
      else {
        if (userInput.toLowerCase().includes('yes')) {
          navigate('/plan');
        } else {
          addChatMessage('assistant', "No problem. You can view your plan anytime by clicking the 'View Plan' button. Is there anything specific you'd like to know about AYUSH practices?");
        }
      }
    } catch (error) {
      console.error("Error in chat flow:", error);
      addChatMessage('assistant', "I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-800 relative">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 backdrop-blur-lg border-b border-emerald-800/30"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/selection')}
            className="text-emerald-200 hover:text-emerald-50 transition"
          >
            <FaArrowLeft className="text-xl" />
          </motion.button>
          <h1 className="text-lg font-semibold text-emerald-50 capitalize">{category}</h1>
          <div className="w-24 h-2 bg-emerald-800/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
              style={{ width: `${Math.min(chatHistory.length * 20, 100)}%` }}
            />
          </div>
        </div>
      </motion.header>
      
      {/* Chat Container */}
      <div className="container mx-auto px-4 py-8 max-w-2xl h-[calc(100vh-160px)]">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <AnimatePresence>
              {chatHistory.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl backdrop-blur-lg border ${
                      message.role === 'user' 
                        ? 'bg-emerald-400/10 border-emerald-400/20'
                        : 'bg-white/5 border-emerald-800/30'
                    }`}
                  >
                    <p className={message.role === 'user' ? 'text-emerald-50' : 'text-emerald-200'}>
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="p-4 rounded-2xl bg-white/5 border border-emerald-800/30 backdrop-blur-lg">
                  <div className="flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-emerald-400 rounded-full"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Input Form */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-4 mt-4 backdrop-blur-lg border border-emerald-800/30 rounded-xl bg-white/5"
          >
            <div className="flex items-center p-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 p-4 bg-transparent outline-none text-emerald-50 placeholder-emerald-400/60"
                disabled={isLoading}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 text-emerald-400 hover:text-emerald-300 rounded-xl transition"
                disabled={isLoading}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaPaperPlane />
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;