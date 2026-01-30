import { Link } from 'react-router-dom';
import { Video, MessageCircle, Building, Eye, ArrowRight, Sparkles, Database, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

const coreModes = [
  {
    icon: Video,
    title: 'Live AI Video Chat',
    description: 'Face-to-face AI conversations with voice and lip-sync'
  },
  {
    icon: Building,
    title: 'Company Intelligence',
    description: 'RAG + shared chats + knowledge memory'
  },
  {
    icon: Eye,
    title: 'Virtual Eyes',
    description: 'Understand the world through images, video, and vision AI'
  }
];

const howItWorks = [
  { number: 1, text: 'Speak / Type' },
  { number: 2, text: 'Add documents, images, or videos' },
  { number: 3, text: 'AI understands context' },
  { number: 4, text: 'Responds with video + voice + intelligence' }
];

const techStack = [
  { icon: Sparkles, name: 'Gemini' },
  { icon: Video, name: 'Gooey' },
  { icon: Cpu, name: 'TensorFlow' },
  { icon: Database, name: 'Pinecone' },
  { icon: Zap, name: 'Firebase' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <AnimatedBackground />

      <nav className="fixed top-0 left-0 right-0 z-50 glass-darker backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <MessageCircle className="w-8 h-8 text-cyan-400" />
              </motion.div>
              <div className="absolute inset-0 bg-cyan-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold heading-font bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 text-gradient tracking-wider">
              Thread.ai
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              to="/login"
              className="px-6 py-2.5 text-sm font-medium glass-effect hover:neon-border rounded-xl transition-all duration-300 hover:scale-105 ripple"
            >
              Login
            </Link>
          </motion.div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight heading-font">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 text-gradient neon-text">
                Thread.ai
              </span>
              <br />
              <span className="text-3xl md:text-5xl text-slate-300">
                Real-Time AI Conversations, Reimagined
              </span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Talk to AI like a real person. Video, voice, documents, vision — all in one thread.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/login"
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-2xl hover:neon-glow transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 ripple relative overflow-hidden"
            >
              <span className="relative z-10">Start a Conversation</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 glass-effect border border-cyan-500/30 text-cyan-300 font-semibold rounded-xl hover:neon-border transition-all duration-300 hover:scale-105 ripple"
            >
              Explore Features
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-t border-blue-500/10">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-center mb-4 heading-font bg-gradient-to-r from-cyan-400 to-blue-400 text-gradient">
              Core Modes
            </h2>
            <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto text-lg">
              Three powerful ways to interact with AI
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {coreModes.map((mode, index) => (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group p-8 rounded-2xl border border-blue-500/20 glass-effect hover:neon-border transition-all duration-500 card-3d"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:animate-pulse-glow transition-all">
                    <mode.icon className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 heading-font text-white group-hover:text-cyan-400 transition-colors">{mode.title}</h3>
                <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">{mode.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-t border-blue-500/10">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-center mb-16 heading-font bg-gradient-to-r from-cyan-400 to-blue-400 text-gradient"
          >
            How It Works
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="group w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center text-3xl font-bold shadow-2xl neon-glow transition-all duration-300 heading-font"
                >
                  {step.number}
                </motion.div>
                <p className="text-lg text-slate-300 font-medium">{step.text}</p>
                {index < howItWorks.length - 1 && (
                  <ArrowRight className="hidden lg:block w-6 h-6 text-cyan-500 absolute right-0 top-12 transform translate-x-1/2 animate-pulse" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-t border-blue-500/10">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-center mb-4 heading-font bg-gradient-to-r from-cyan-400 to-blue-400 text-gradient"
          >
            Tech Stack
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-400 text-center mb-12 text-lg"
          >
            Powered by cutting-edge AI technologies
          </motion.p>
          <div className="flex flex-wrap justify-center gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="group px-8 py-5 rounded-xl border border-blue-500/20 glass-effect hover:neon-border flex items-center gap-3 cursor-default transition-all duration-300"
              >
                <tech.icon className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                <span className="text-slate-300 group-hover:text-white transition-colors font-medium text-lg">{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative py-20 px-6 border-t border-blue-500/10 glass-darker">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <MessageCircle className="w-10 h-10 text-cyan-400" />
                <div className="absolute inset-0 bg-cyan-400 rounded-full blur-xl opacity-50"></div>
              </div>
              <span className="text-3xl font-bold heading-font bg-gradient-to-r from-cyan-400 to-blue-400 text-gradient">
                Thread.ai
              </span>
            </div>
            <p className="text-slate-400 mb-6 text-xl">
              Experience the Future of AI Interaction
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:neon-glow transition-all duration-300 hover:scale-105 ripple"
              >
                Build with Thread.ai
              </Link>
            </div>
          </motion.div>
          <p className="text-slate-500 text-sm">
            Real-time AI conversations reimagined for the modern age
          </p>
        </div>
      </footer>
    </div>
  );
}
