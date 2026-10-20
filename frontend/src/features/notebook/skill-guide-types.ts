export type GuideLanguage = "ur" | "en";

export type SkillSection = {
  title: string;
  body: string;
};

export type InterviewQuestion = {
  number: number;
  question: string;
  answer: string;
};

export type InterviewSkill = {
  number: number;
  title: string;
  category: string;
  sections: SkillSection[];
  questions: InterviewQuestion[];
};

export type SkillGuide = {
  title: string;
  skills: InterviewSkill[];
  questionCount: number;
};
