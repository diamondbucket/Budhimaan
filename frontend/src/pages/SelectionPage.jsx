import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaLeaf, FaHeartbeat, FaAppleAlt, FaSpa, FaArrowRight } from 'react-icons/fa';

export default function SelectionPage() {
  const categories = [
    { 
      icon: FaLeaf, 
      title: 'Lifestyle',
      desc: 'Daily routines & holistic practices',
      color: 'from-emerald-400 to-teal-300'
    },
    { 
      icon: FaHeartbeat, 
      title: 'Health',
      desc: 'Wellness & preventive care',
      color: 'from-amber-400 to-orange-300'
    },
    { 
      icon: FaAppleAlt, 
      title: 'Diet',
      desc: 'Nutrition & eating habits',
      color: 'from-rose-400 to-pink-300'
    },
    { 
      icon: FaSpa, 
      title: 'Skin Care',
      desc: 'Natural beauty routines',
      color: 'from-indigo-400 to-blue-300'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-800 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10 mix-blend-soft-light">
        <div className="absolute w-[40vw] h-[40vw] bg-emerald-500/20 rounded-full -top-[10vw] -left-[10vw] blur-3xl"></div>
        <div className="absolute w-[30vw] h-[30vw] bg-teal-500/20 rounded-full -bottom-[8vw] -right-[8vw] blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6 text-emerald-300">
            <FaLeaf className="text-3xl" />
            <div className="h-px w-16 bg-emerald-300/50" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-emerald-50 mb-4">
            Begin Your <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Wellness Journey</span>
          </h1>
          <p className="text-lg text-emerald-200/90 max-w-2xl mx-auto">
            Select your focus area to receive personalized AYUSH recommendations
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(({ icon: Icon, title, desc, color }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.1 + 0.3,
                duration: 0.6,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -8,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                  mass: 0.5
                }
              }}
              className="group relative"
            >
              <Link
                to={`/chat/${title.toLowerCase()}`}
                className="block h-full p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-emerald-400/30"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`} />
                
                {/* Icon container */}
                <div className="mb-6 w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
                  <Icon className="text-3xl text-emerald-400" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-semibold text-emerald-50 mb-3">{title}</h3>
                <p className="text-emerald-300/80 mb-6">{desc}</p>
                
                {/* Animated button */}
                <div className="flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  <span className="font-medium">Get Started</span>
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="inline-block"
                  >
                    <FaArrowRight className="text-lg" />
                  </motion.span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Decorative text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1 }}
          className="absolute -bottom-20 left-0 right-0 text-[20vw] font-bold text-center text-emerald-500/20 pointer-events-none select-none"
        >
          Ayurveda
        </motion.div>
      </div>
    </div>
  );
}