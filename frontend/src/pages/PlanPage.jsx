import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../contexts/UserDataContext';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaDownload, FaShare, FaPrint, FaComment, FaChevronDown, FaChevronUp, FaUtensils, FaRunning, FaMoon } from 'react-icons/fa';
import '../styles/PlanPage.css';
import Header from '../components/Header';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const ProgressRing = ({ percentage, color }) => {
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg height={radius*2} width={radius*2}>
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transform -rotate-90"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-semibold ${color}`}>{percentage}%</span>
      </div>
    </div>
  );
};

const DoshaProfile = ({ userProfile }) => {
  // Extract dosha information from user profile if available
  const doshaInfo = userProfile?.prakriti_assessment || {};
  const vata = doshaInfo.vata_percentage || 33;
  const pitta = doshaInfo.pitta_percentage || 33;
  const kapha = doshaInfo.kapha_percentage || 34;
  
  return (
    <motion.div 
      variants={fadeIn}
      className="dosha-profile"
    >
      <h3 className="dosha-title">Your Dosha Profile</h3>
      
      <div className="dosha-bar-container">
        <div className="dosha-bar">
          <div 
            style={{ width: `${vata}%` }} 
            className="dosha-bar-vata"
          >
            Vata {vata}%
          </div>
          <div 
            style={{ width: `${pitta}%` }} 
            className="dosha-bar-pitta"
          >
            Pitta {pitta}%
          </div>
          <div 
            style={{ width: `${kapha}%` }} 
            className="dosha-bar-kapha"
          >
            Kapha {kapha}%
          </div>
        </div>
      </div>
      
      <div className="dosha-cards">
        <div className="dosha-card dosha-card-vata">
          <h4 className="dosha-card-title">
            <span className="dosha-indicator dosha-indicator-vata"></span>
            Vata
          </h4>
          <p className="dosha-card-description">Creative, quick-thinking, adaptable. Governs movement and nervous system.</p>
        </div>
        <div className="dosha-card dosha-card-pitta">
          <h4 className="dosha-card-title">
            <span className="dosha-indicator dosha-indicator-pitta"></span>
            Pitta
          </h4>
          <p className="dosha-card-description">Focused, determined, intelligent. Governs metabolism and digestion.</p>
        </div>
        <div className="dosha-card dosha-card-kapha">
          <h4 className="dosha-card-title">
            <span className="dosha-indicator dosha-indicator-kapha"></span>
            Kapha
          </h4>
          <p className="dosha-card-description">Calm, steady, compassionate. Governs structure and fluid balance.</p>
        </div>
      </div>
    </motion.div>
  );
};

const PlanPage = () => {
  const navigate = useNavigate();
  const { userProfile, lifestylePlan } = useUserData();
  const [activeSection, setActiveSection] = useState('all');
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  
  useEffect(() => {
    // Redirect if no plan is available
    if (!lifestylePlan) {
      navigate('/selection');
    }
  }, [lifestylePlan, navigate]);
  
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([lifestylePlan], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'AYUSH_Lifestyle_Plan.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (!userProfile || !lifestylePlan) {
    return (
      <div className="no-plan-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="no-plan-card"
        >
          <div className="no-plan-icon">
            <FaComment className="icon" />
          </div>
          <h2 className="no-plan-title">No Plan Available</h2>
          <p className="no-plan-message">You need to complete the consultation to view your personalized AYUSH lifestyle plan.</p>
          <button 
            onClick={() => navigate('/selection')}
            className="start-consultation-btn"
          >
            Start New Consultation
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="space-y-8"
        >
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {userProfile?.personal_info?.name || "Your"} Wellness Plan
                </h1>
                <p className="text-slate-600 mt-1">
                  Created {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
                  <FaDownload className="text-xl" />
                </button>
                <button className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
                  <FaPrint className="text-xl" />
                </button>
              </div>
            </div>

            {/* Dosha Progress */}
            <div className="grid grid-cols-3 gap-6 py-6 border-y border-slate-200">
              {[
                { dosha: 'Vata', color: 'text-purple-600', percentage: 35 },
                { dosha: 'Pitta', color: 'text-orange-600', percentage: 40 },
                { dosha: 'Kapha', color: 'text-emerald-600', percentage: 25 }
              ].map((item, index) => (
                <motion.div 
                  key={item.dosha}
                  variants={fadeIn}
                  className="flex items-center gap-4"
                >
                  <ProgressRing 
                    percentage={item.percentage} 
                    color={item.color} 
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{item.dosha}</h3>
                    <p className="text-slate-600 text-sm">Dominant dosha balance</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Plan Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Routine */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <FaMoon className="text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Daily Routine</h2>
              </div>
              <div className="space-y-4">
                {[
                  { time: '6:00 AM', activity: 'Wake up & oil pulling' },
                  { time: '6:30 AM', activity: 'Yoga & meditation' },
                  { time: '7:30 AM', activity: 'Herbal breakfast' }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-16 text-slate-600">{item.time}</div>
                    <div className="flex-1 pl-4 border-l-2 border-purple-100">
                      {item.activity}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Diet Plan */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <FaUtensils className="text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Diet Plan</h2>
              </div>
              <div className="grid gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <h3 className="font-semibold text-emerald-800 mb-2">Recommended</h3>
                  <ul className="list-disc pl-5 text-slate-600 space-y-1">
                    <li>Warm herbal teas</li>
                    <li>Seasonal fruits</li>
                    <li>Whole grain porridge</li>
                  </ul>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <h3 className="font-semibold text-red-800 mb-2">Avoid</h3>
                  <ul className="list-disc pl-5 text-slate-600 space-y-1">
                    <li>Cold beverages</li>
                    <li>Processed foods</li>
                    <li>Leftover meals</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Exercise Plan */}
            <motion.div 
              variants={fadeIn}
              className="bg-white rounded-2xl shadow-sm p-6 md:col-span-2"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                  <FaRunning className="text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Exercise Regimen</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { 
                    title: "Morning Yoga", 
                    duration: "30 mins",
                    intensity: "Moderate",
                    type: "Hatha Yoga"
                  },
                  { 
                    title: "Evening Walk", 
                    duration: "45 mins",
                    intensity: "Light",
                    type: "Nature Walk"
                  },
                  { 
                    title: "Breathing Exercises", 
                    duration: "15 mins",
                    intensity: "Gentle",
                    type: "Pranayama"
                  }
                ].map((exercise, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-semibold text-slate-800 mb-2">{exercise.title}</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Duration: {exercise.duration}</p>
                      <p>Intensity: {exercise.intensity}</p>
                      <p>Type: {exercise.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6"
        >
          <button className="p-4 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-transform hover:scale-105">
            <FaComment className="text-xl" />
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default PlanPage;