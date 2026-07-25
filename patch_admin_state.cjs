const fs = require('fs');
let code = fs.readFileSync('src/components/ContentCreator.tsx', 'utf8');

code = code.replace(
  `  // Admin Tab State
  const [a_grade, setA_Grade] = useState('');
  const [a_subject, setA_Subject] = useState('');
  const [a_customSubject, setA_CustomSubject] = useState('');
  const [a_type, setA_Type] = useState('');
  const [a_topic, setA_Topic] = useState('');
  const [a_customPrompt, setA_CustomPrompt] = useState('');
  const [a_tone, setA_Tone] = useState('Formal & Professional');
  const [a_generateImage, setA_GenerateImage] = useState(false);`,
  `  // Admin Tab State
  const [a_grade, setA_Grade] = useState('');
  const [a_subject, setA_Subject] = useState('');
  const [a_customSubject, setA_CustomSubject] = useState('');
  const [a_type, setA_Type] = useState('');
  const [a_topic, setA_Topic] = useState('');
  const [a_customPrompt, setA_CustomPrompt] = useState('');
  const [a_tone, setA_Tone] = useState('Formal & Professional');
  const [a_generateImage, setA_GenerateImage] = useState(false);
  const [a_school, setA_School] = useState('');
  const [a_timeDate, setA_TimeDate] = useState('');
  const [a_recipient, setA_Recipient] = useState('');
  const [a_venue, setA_Venue] = useState('');
  const [a_classTeacher, setA_ClassTeacher] = useState('');
  const [a_schoolPrincipal, setA_SchoolPrincipal] = useState('');`
);

code = code.replace(
  `        adminType: a_type,
        topic: a_topic,
        tone: a_tone,
        generateImage: a_generateImage
      }, provider);`,
  `        documentType: a_type,
        purpose: a_topic,
        keyPoints: a_customPrompt,
        schoolName: a_school,
        tone: a_tone,
        generateImage: a_generateImage,
        additionalInstructions: a_customPrompt,
        timeDate: a_timeDate,
        recipient: a_recipient,
        venue: a_venue,
        classTeacher: a_classTeacher,
        schoolPrincipal: a_schoolPrincipal
      }, provider);`
);

fs.writeFileSync('src/components/ContentCreator.tsx', code);
