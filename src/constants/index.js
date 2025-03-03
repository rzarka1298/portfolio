import project1 from "../assets/projects/calico.png";
import project2 from "../assets/projects/neuromakerHand.jpeg";
import project3 from "../assets/projects/project-3.jpg";
import project4 from "../assets/projects/llama.png";

export const HERO_CONTENT = `I am a skilled full-stack developer with expertise in Python, Java, JS, TypeScript, HTML, React, etc.
 I specialize in building scalable, AI-driven applications and data-intensive systems. With a strong foundation in software engineering and automation, I create efficient, 
 user-centric solutions that enhance performance and usability.`;

export const ABOUT_TEXT = `I am passionate about computer science and its power to drive innovation and solve complex problems. With experience in software engineering, AI development, and research, I have worked on projects ranging from building AI-driven chatbots to developing patent search algorithms and interactive touchscreen systems. My skills in Python, Java, and cloud computing, combined with hands-on experience in machine learning and robotics, enable me to create impactful, scalable solutions.`;

export const EXPERIENCES = [
  {
    year: "Aug 2024 - Present",
    role: "Research Assistant",
    company: "UMDCS SmartLabs",
    description: "Developing interactive touchscreen to Calico, a miniature relocatable wearable system with fast and precise locomotion for on-body interaction, actuation, and sensing. Working to implement AI to allow robots to sense the actions of human hosts and display related statistics",
    technologies: ["Python", "C++", "Arduino", "Hardware Design"],
  },
  {
    year: "May 2023 - May 2024",
    role: "Software Engineer Intern",
    company: "Aspire JHU APL",
    description: "Utilized Matlab, Python, and Github to develop a production-level application to track inventory. Led 10 intern developers: set meetings and deadlines for fellow interns throughout app development, presented findings to APL Air Missile Defense Sector administration, and surveyed employees for user preferences on SAILS app",
    technologies: ["MATLAB", "Python", "Github", "Teamwork"],
  },
  {
    year: "May 2022 - Sept 2022",
    role: "Junior Developer",
    company: "Neuron-G",
    description: "Conducted study to determine the extent of bias in Supreme Court cases using SKLearn's Random Forest to capture feature importance between demographic variables such as race, gender, and age",
    technologies: ["SKLearn Random Forest", "Python", "Github"],
  },
  {
    year: "May 2020 - Aug 2022",
    role: "Research and Development Intern",
    company: "BlueWave Semiconductors",
    description: "Led the implementation of automated remote monitoring for the CVD System, Substrate heaters, and Thermal Evaporator Deposition Systems using PLC circuitry programming and sensors, which was especially useful during the pandemic for remote depositions",
    technologies: ["CVD", "PLC", "Ladder Logic", "Professional Development"],
  },
];

export const PROJECTS = [
  {
    title: "Agentic Rag for IP",
    image: project4,
    description:
      "Developing a Retrieval-Augmented Generation (RAG) pipeline leveraging Llama Stack to parse, vectorize, and query patent XML files, providing high-relevance document retrieval and dynamic, context-driven answers. Integrating open-source LLM models and a vector database (AWS) to handle large volumes of patent text, enabling semantically rich searching and automated patent analysis.",
    technologies: ["Python", "llama-stack", "vLLM", "FAISS", "Inference Models"],
  },
  {
    title: "Calico Smartlabs",
    image: project1,
    description:
      "A fully functional miniature relocatable wearable system with fast and precise locomotion for on-body interaction, actuation, and sensing.",
    technologies: ["HTML", "Python", "C++", "UI Development"],
  },
  {
    title: "Neuromaker International Bioengineering Competition",
    image: project2,
    description:
      "Built a prosthetic hand to convert speech to American Sign Language using Google APIs, Python, RaspberryOS.",
    technologies: ["Google API", "Python", "RaspberryOS"],
  },
  {
    title: "Portfolio Website",
    image: project3,
    description:
      "A personal portfolio website showcasing projects, skills, and contact information.",
    technologies: ["HTML", "CSS", "React", "Tailwind"],
  },
];

export const CONTACT = {
  address: "12200 Basslers Way, Clarksville, MD 21029 ",
  phoneNo: "443-567-0781 ",
  email: "rugvedzarkar@gmail.com",
};
