import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const collectInfo = async (basicInfo) => {
  try {
    const response = await axios.post(`${API_URL}/collect-info`, { basicInfo });
    return response.data;
  } catch (error) {
    console.error('Error collecting info:', error);
    throw error;
  }
};

export const submitResponses = async (responses) => {
  try {
    const response = await axios.post(`${API_URL}/submit-responses`, { responses });
    return response.data;
  } catch (error) {
    console.error('Error submitting responses:', error);
    throw error;
  }
};

export const generatePlan = async (userProfile) => {
  try {
    const response = await axios.post(`${API_URL}/generate-plan`, { userProfile });
    return response.data;
  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
};

export const askQuestion = async (question, userProfile, lifestylePlan) => {
  try {
    const response = await axios.post(`${API_URL}/ask-question`, {
      question,
      userProfile,
      lifestylePlan
    });
    return response.data;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};