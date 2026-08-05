const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
// Remove one </div> from the end block
code = code.replace(`          </div>
        </div>
      </div>
    </div>
  );`, `        </div>
      </div>
    </div>
  );`);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
