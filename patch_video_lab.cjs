const fs = require('fs');
let code = fs.readFileSync('src/components/ContentCreator.tsx', 'utf8');

code = code.replace(
  '<VideoLabConsole isDarkMode={isDarkMode} onClose={onClose} />',
  `<VideoLabConsole 
                isDarkMode={isDarkMode} 
                onClose={onClose} 
                vid_model={vid_model}
                setVid_Model={setVid_Model}
                vid_prompt={vid_prompt}
                setVid_Prompt={setVid_Prompt}
                vid_seed={vid_seed}
                setVid_Seed={setVid_Seed}
                vid_fps={vid_fps}
                setVid_Fps={setVid_Fps}
              />`
);

fs.writeFileSync('src/components/ContentCreator.tsx', code);
