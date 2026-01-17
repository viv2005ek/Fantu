import { Link } from 'react-router-dom';
import { Video, Zap, Users, Wifi, MessageSquare, Image, ArrowRight, Brain, Eye, Building, Code, Radio } from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'AI Video Responses',
    description: 'AI replies using short talking-avatar videos.'
  },
  {
    icon: Zap,
    title: 'Fake-Live Video Experience',
    description: 'Asynchronous responses designed to feel live.'
  },
  {
    icon: Users,
    title: 'Avatar Personality Control',
    description: 'Choose how the AI speaks and explains.'
  },
  {
    icon: Wifi,
    title: 'Low Bandwidth Friendly',
    description: 'No real-time video required.'
  },
  {
    icon: MessageSquare,
    title: 'Session-Based Conversations',
    description: 'Context is remembered per conversation.'
  },
  {
    icon: Image,
    title: 'Optional Image Avatar',
    description: 'Upload an image to personalize the avatar.'
  }
];

const steps = [
  { number: 1, text: 'You ask a question' },
  { number: 2, text: 'AI processes it' },
  { number: 3, text: 'AI generates a video reply' },
  { number: 4, text: 'You watch and respond' }
];

const futureEnhancements = [
  { icon: Brain, title: 'Multi-LLM Support' },
  { icon: Eye, title: 'Vision-Based AI' },
  { icon: Building, title: 'Industry-Specific Avatars' },
  { icon: Code, title: 'Developer API & SDK' },
  { icon: Radio, title: 'Real-Time Interaction (Research)' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-8 h-8 text-white" />
            <span className="text-xl font-bold">Persona Video AI</span>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-white hover:text-gray-300 transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI That Talks Back — Visually
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            Persona Video AI lets you chat with an AI that responds using talking video messages — without live streaming.
          </p>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Instead of plain text replies, Persona Video AI delivers short AI-generated video responses that feel like a real conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              Try the Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What You Can Do Today
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Experience the future of AI conversations with video responses
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-900 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white text-black flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <p className="text-lg text-gray-300">{step.text}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block w-6 h-6 text-gray-600 absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Future Enhancements
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Coming soon to Persona Video AI
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {futureEnhancements.map((item) => (
              <div
                key={item.title}
                className="px-6 py-4 rounded-lg border border-gray-700 bg-gray-900/30 flex items-center gap-3 cursor-default"
              >
                <item.icon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-400">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Video className="w-6 h-6 text-gray-400" />
            <span className="text-lg font-semibold text-gray-300">Persona Video AI</span>
          </div>
          <p className="text-gray-400 mb-2">
            Persona Video AI — Async AI video conversations.
          </p>
          <p className="text-gray-500 text-sm">
            This demo does not provide live video calls.
          </p>
        </div>
      </footer>
    </div>
  );
}
