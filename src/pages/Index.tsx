import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button Variants";
import { Wind, Droplet, Brain, FlaskConical } from "lucide-react";

const ChildSafeEnvirons = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col justify-start items-center bg-gradient-to-b from-teal-100 via-white to-amber-100 overflow-hidden px-4 pt-[10vh]">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute top-20 left-0 right-0 mx-auto w-full flex justify-center"
      >
        <div className="w-3/4 md:w-1/2 h-16 bg-gradient-to-r from-green-400 via-yellow-300 to-orange-500 opacity-60 blur-2xl rounded-full" />
      </motion.div>

      <div className="absolute bottom-0 left-0 w-full">
        <img
          src="https://img.freepik.com/premium-vector/modern-city-silhouette-background-town-with-skyscrapers-black-silhouette-city-skyline_820464-1001.jpg"
          alt="City Skyline"
          className="w-full h-40 md:h-52 object-cover"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center p-6 w-full max-w-md"
      >
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
          ChildSafeEnvirons
        </h1>
        <p className="text-gray-800 text-base md:text-lg max-w-sm mx-auto mb-6 leading-relaxed">
          Your personalized companion for ensuring safe and healthy surroundings
          for children and families.
        </p>
        <div className="relative w-40 h-20 mx-auto mb-3">
          <div className="absolute inset-0 flex justify-center items-end">
            <div className="w-32 h-16 rounded-t-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 shadow-md" />
          </div>
          <motion.div
            initial={{ rotate: -90 }}
            animate={{ rotate: -45 }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 origin-bottom w-1 h-12 bg-gray-800 rounded-full"
          />
        </div>

        <p className="text-md font-semibold text-gray-900 mb-6">Moderate</p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="default"
            size="lg"
            className="bg-green-500 text-white hover:bg-green-600 w-full rounded-full text-lg shadow-md mb-8"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-sm border border-gray-100"
          >
            <Wind className="w-7 h-7 text-green-500 mb-1" />
            <p className="text-gray-900 font-semibold text-sm md:text-base">
              Air Quality
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-sm border border-gray-100"
          >
            <Droplet className="w-7 h-7 text-blue-500 mb-1" />
            <p className="text-gray-900 font-semibold text-sm md:text-base">
              Water Quality
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-sm border border-gray-100"
          >
            <FlaskConical className="w-7 h-7 text-yellow-500 mb-1" />
            <p className="text-gray-900 font-semibold text-sm md:text-base">
              Soil Health
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-sm border border-gray-100"
          >
            <Brain className="w-7 h-7 text-purple-500 mb-1" />
            <p className="text-gray-900 font-semibold text-sm md:text-base">
              AI Reports
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChildSafeEnvirons;
