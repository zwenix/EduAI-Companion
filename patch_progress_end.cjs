const fs = require('fs');
let code = fs.readFileSync('src/components/ProgressReports.tsx', 'utf8');

const targetStr = `      )}
    </div>
  );
}`;

const replaceStr = `      )}
          </div>
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/ProgressReports.tsx', code);
