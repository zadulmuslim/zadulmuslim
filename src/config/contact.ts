export const CONTACT_TOPICS = [
  { value: "general", label: "সাধারণ জিজ্ঞাসা" },
  { value: "correction", label: "ভুল সংশোধন / তথ্যসূত্র" },
  { value: "suggestion", label: "পরামর্শ ও মতামত" },
  { value: "technical", label: "প্রযুক্তিগত সমস্যা" },
  { value: "partnership", label: "সহযোগিতা / অংশীদারিত্ব" },
  { value: "other", label: "অন্যান্য" },
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"];
export const TOPIC_LABEL = Object.fromEntries(CONTACT_TOPICS.map((t) => [t.value, t.label])) as Record<string, string>;
