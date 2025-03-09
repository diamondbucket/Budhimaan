import { createContext, useState, useContext } from 'react';

const UserDataContext = createContext();

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [responses, setResponses] = useState([]);
  const [lifestylePlan, setLifestylePlan] = useState(null);
  const [category, setCategory] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResponse = (question, answer) => {
    setResponses([...responses, { question, answer }]);
  };

  const addChatMessage = (role, content) => {
    setChatHistory([...chatHistory, { role, content }]);
  };

  const resetData = () => {
    setUserProfile(null);
    setResponses([]);
    setLifestylePlan(null);
    setChatHistory([]);
  };

  const value = {
    userProfile,
    setUserProfile,
    responses,
    setResponses,
    addResponse,
    lifestylePlan,
    setLifestylePlan,
    category,
    setCategory,
    chatHistory,
    setChatHistory,
    addChatMessage,
    isLoading,
    setIsLoading,
    resetData
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};