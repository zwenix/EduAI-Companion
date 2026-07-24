const fs = require('fs');
let code = fs.readFileSync('src/components/ContentCreator.tsx', 'utf8');

code = code.replace(
  `{/* Phase Quick-Select Pill Buttons (only for teaching/visual) */}
                  {activeTab !== 'admin' && (
                    <div className="space-y-1.5">`,
  `{/* Phase Quick-Select Pill Buttons */}
                    <div className="space-y-1.5">`
);

code = code.replace(
  `const currentGrade = activeTab === 'teaching' ? t_grade : v_grade;`,
  `const currentGrade = activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade;`
);

code = code.replace(
  `                                } else {
                                  setV_Grade(phase.grade);
                                  setV_Subject('');
                                  setV_Topic('');
                                }`,
  `                                } else if (activeTab === 'visual') {
                                  setV_Grade(phase.grade);
                                  setV_Subject('');
                                  setV_Topic('');
                                } else {
                                  setA_Grade(phase.grade);
                                  setA_Subject('');
                                  setA_Topic('');
                                }`
);

code = code.replace(
  `                      </div>
                    </div>
                  )}`,
  `                      </div>
                    </div>`
);

fs.writeFileSync('src/components/ContentCreator.tsx', code);
