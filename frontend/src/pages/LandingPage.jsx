import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaLeaf, FaHeartbeat, FaUserMd, FaBrain, FaChartLine, FaUsers,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaComments
} from 'react-icons/fa';
import '../styles/LandingPage.css';

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

const staggerVariants = {
  visible: { transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AyurvedicPattern = () => {
  const patterns = [
    { // Banyan leaf pattern
      path: "M12 3.2c2.3-1.5 5.7-.5 7.4 1.2 1.7 1.7 2.5 4.8 1.2 7.4-1.3 2.6-4.3 4.3-7.4 4.3-3.1 0-6.4-1.7-7.4-4.3-1-2.6.2-5.7 1.2-7.4 1-1.7 3.7-2.7 5.9-1.2z",
      style: { top: '15%', left: '5%', width: '8vw' },
      animation: { y: ["0%", "12%", "0%"], rotate: [0, 3, -2, 0] }
    },
    { // Ashoka leaf pattern
      path: "M20.5 4.3c1.1 2.4-.5 5.3-2.9 6.4-2.4 1.1-5.3-.5-6.4-2.9-1.1-2.4.5-5.3 2.9-6.4 2.4-1.1 5.3.5 6.4 2.9z",
      style: { top: '25%', left: '12%', width: '6vw' },
      animation: { y: ["0%", "15%", "0%"], rotate: [0, -4, 3, 0] }
    },
    { // Lotus petal pattern
      path: "M15.7 2.1c3.1-1.1 6.8.8 8.2 3.5 1.4 2.7 1.1 6.3-1.1 8.5-2.2 2.2-5.8 2.5-8.5 1.1-2.7-1.4-4.6-5.1-3.5-8.2 1.1-3.1 4.2-5.3 6.9-4.9z",
      style: { top: '18%', right: '7%', width: '7vw' },
      animation: { y: ["0%", "10%", "0%"], rotate: [0, 5, -3, 0] }
    },
    { // Neem leaf pattern
      path: "M10.5 4.8c1.8-1 4.2-.3 5.5 1.1 1.3 1.4 1.8 3.7.8 5.5-1 1.8-3.3 3.3-5.5 3.3-2.2 0-4.9-1.5-5.5-3.3-.6-1.8.1-4.2 1.1-5.5 1-1.3 2.8-2.1 4.6-1.1z",
      style: { top: '30%', right: '15%', width: '5vw' },
      animation: { y: ["0%", "8%", "0%"], rotate: [0, -2, 4, 0] }
    },
    { // Tulsi leaf pattern
      path: "M18.2 5.4c1.5-0.7 3.2-0.2 4.1 1.1 0.9 1.3 0.7 3-0.4 4.2-1.1 1.2-2.8 1.6-4.2 0.9-1.4-0.7-2.3-2.3-2-3.8 0.3-1.5 1.5-2.7 2.5-2.4z",
      style: { bottom: '10%', left: '20%', width: '6vw' },
      animation: { y: ["0%", "9%", "0%"], rotate: [0, 4, -1, 0] }
    },
    { // Ayurvedic mandala pattern
      path: "M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2zm0 18c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8z",
      style: { bottom: '15%', right: '25%', width: '8vw' },
      animation: { rotate: [0, 15, -15, 0], scale: [1, 1.05, 0.95, 1] }
    }
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {patterns.map((pattern, index) => (
        <motion.svg
          key={index}
          viewBox="0 0 24 24"
          className="absolute text-emerald-600/20"
          style={pattern.style}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            ...pattern.animation
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path 
            fill="currentColor" 
            d={pattern.path}
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </motion.svg>
      ))}
      
      {/* Add subtle herbal texture overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath fill='%234ade80' d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zM-6 8c4 0 6.627-4.373 8-8 1.373 3.627 4 8 8 8 4 0 6.627-4.373 8-8 1.373 3.627 4 8 8 8 4 0 6.627-4.373 8-8 1.373 3.627 4 8 8 8v2c-4 0-6.627-4.373-8-8-1.373 3.627-4 8-8 8-4 0-6.627-4.373-8-8-1.373 3.627-4 8-8 8-4 0-6.627-4.373-8-8-1.373 3.627-4 8-8 8v-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        mixBlendMode: "soft-light"
      }} />
    </div>
  );
};

const BackgroundLeaves = () => {
  return <AyurvedicPattern />;
};

const LandingPage = () => {
  const constraintsRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-800">
      <BackgroundLeaves />
      
      {/* Add motion to the main container */}
      <motion.div 
        ref={constraintsRef}
        className="relative"
      >
        {/* Navigation Bar */}
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-emerald-50">AyurAI</span>
            <motion.div whileHover={{ scale: 1.05 }}>
              <a href="/selection" className="px-6 py-2 bg-emerald-100/10 rounded-full text-emerald-50 hover:bg-emerald-100/20 transition">
                Get Started
              </a>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 50 }
          }}
          className="container mx-auto px-6 py-24 text-center relative z-10"
        >
          {/* Add animated herbal border */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
          >
            <svg 
              viewBox="0 0 500 200" 
              className="w-full h-full translate-x-28"
            >
              <path 
                d="M10,100 Q50,50 90,100 T170,100 T250,100 T330,100 T410,100" 
                stroke="currentColor" 
                fill="none"
                strokeWidth="2"
                className="text-emerald-600"
              />
            </svg>
          </motion.div>

          <h1 className="text-5xl font-bold text-emerald-50 mb-6 leading-tight">
            Ancient Wisdom,<br />
            <span className="text-emerald-200">Modern Wellness</span>
          </h1>
          
          <p className="text-xl text-emerald-100/90 mb-8 max-w-2xl mx-auto">
            Personalized AYUSH lifestyle plans powered by AI, blending traditional healing with modern science.
          </p>

          {/* Update CTA button with leaf animation */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="relative inline-block"
          >
            <a 
              href="/selection"
              className="inline-block px-8 py-4 bg-emerald-300 text-emerald-900 rounded-full text-lg font-semibold shadow-lg hover:bg-emerald-200 transition relative z-10"
            >
              Start Your Assessment
            </a>
          </motion.div>
        </motion.section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 pb-24">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {['Holistic Analysis', 'Personalized Plans', 'Expert Guidance'].map((feature, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                className="bg-emerald-800/30 p-8 rounded-2xl backdrop-blur-sm border border-emerald-200/10 hover:border-emerald-300/30 transition"
              >
                <div className="w-12 h-12 bg-emerald-300/10 rounded-xl mb-6 flex items-center justify-center">
                  <div className="w-6 h-6 bg-emerald-300 rounded-full" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-50 mb-4">{feature}</h3>
                <p className="text-emerald-200/70">Customized recommendations based on your unique dosha profile</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-emerald-900">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-emerald-50 mb-4">3-Step Wellness Journey</h2>
              <p className="text-emerald-200/80 max-w-2xl mx-auto">
                Simple process for transformative results
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { 
                  title: "Dosha Assessment", 
                  icon: FaLeaf,
                  desc: "Discover your unique mind-body constitution through AI-powered analysis"
                },
                { 
                  title: "Personalized Plan", 
                  icon: FaChartLine,
                  desc: "Receive custom recommendations for diet, exercise, and daily routines"
                },
                { 
                  title: "Lifestyle Integration", 
                  icon: FaUsers,
                  desc: "Implement your plan with guided support and progress tracking"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-emerald-300/10 rounded-2xl mb-6 mx-auto flex items-center justify-center">
                    <step.icon className="text-3xl text-emerald-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-50 mb-4">{step.title}</h3>
                  <p className="text-emerald-200/70">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-emerald-800">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-emerald-50 mb-4">Success Stories</h2>
              <p className="text-emerald-200/80">Join thousands who transformed their lives</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  className="bg-emerald-700/30 p-8 rounded-2xl backdrop-blur-sm"
                >
                  <p className="text-emerald-200/80 mb-4">"AyurAI helped me balance my doshas and achieve sustainable wellness like never before!"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-300 mr-4"></div>
                    <div>
                      <h4 className="font-semibold text-emerald-50">Sarah K.</h4>
                      <p className="text-sm text-emerald-200/60">Yoga Instructor</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-emerald-900">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-emerald-800/30 rounded-3xl p-12 backdrop-blur-sm"
            >
              <h2 className="text-3xl font-bold text-emerald-50 mb-4">Start Your Journey Today</h2>
              <p className="text-emerald-200/80 mb-8 max-w-xl mx-auto">
                Experience the synergy of ancient Ayurveda and modern AI technology
              </p>
              <motion.div whileHover={{ scale: 1.05 }}>
                <a 
                  href="/selection"
                  className="inline-block px-8 py-4 bg-emerald-300 text-emerald-900 rounded-full text-lg font-semibold shadow-lg hover:bg-emerald-200 transition"
                >
                  Begin Assessment
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-emerald-950/50 py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 text-emerald-200">
              <div>
                <h4 className="text-lg font-semibold text-emerald-50 mb-4">AyurAI</h4>
                <p className="text-sm">Bringing Ayurveda into the digital age</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-emerald-50 mb-4">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-emerald-300">Blog</a></li>
                  <li><a href="#" className="hover:text-emerald-300">FAQs</a></li>
                  <li><a href="#" className="hover:text-emerald-300">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-emerald-50 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-emerald-300">Privacy</a></li>
                  <li><a href="#" className="hover:text-emerald-300">Terms</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-emerald-50 mb-4">Connect</h4>
                <div className="flex space-x-4">
                  {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, i) => (
                    <a key={i} href="#" className="p-2 hover:text-emerald-300">
                      <Icon className="text-xl" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-emerald-800/50 mt-12 pt-8 text-center text-sm text-emerald-200/60">
              © 2025 AyurAI. All rights reserved.
            </div>
          </div>
        </footer>

        {/* Floating Chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8"
        >
          <button className="p-4 bg-emerald-300 text-emerald-900 rounded-full shadow-lg hover:bg-emerald-200 transition">
            <FaComments className="text-xl" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;