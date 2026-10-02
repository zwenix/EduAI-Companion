const fs = require('fs');
let code = fs.readFileSync('src/components/ContentCreator.tsx', 'utf8');

// Replace `{activeTab !== 'admin' && (` before Grade selector
code = code.replace(
  `{/* Grade Selector (only for teaching/visual) */}
                    {activeTab !== 'admin' && (
                      <div>
                        <Label>Grade Level (R-12)</Label>
                        <Select
                          isDarkMode={isDarkMode}
                          value={activeTab === 'teaching' ? t_grade : v_grade}
                          className={cn(
                            (activeTab === 'teaching' ? t_grade : v_grade) && (isDarkMode ? "border-cyan-400/60 bg-cyan-950/30 text-cyan-200" : "border-cyan-300 bg-cyan-50/80")
                          )}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            if (activeTab === 'teaching') {
                              setT_Grade(val);
                              setT_Subject('');
                              setT_Topic('');
                            } else {
                              setV_Grade(val);
                              setV_Subject('');
                              setV_Topic('');
                            }
                          }}
                        >`,
  `{/* Grade Selector */}
                      <div>
                        <Label>Grade Level (R-12)</Label>
                        <Select
                          isDarkMode={isDarkMode}
                          value={activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade}
                          className={cn(
                            (activeTab === 'teaching' ? t_grade : activeTab === 'visual' ? v_grade : a_grade) && (isDarkMode ? "border-cyan-400/60 bg-cyan-950/30 text-cyan-200" : "border-cyan-300 bg-cyan-50/80")
                          )}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            if (activeTab === 'teaching') {
                              setT_Grade(val);
                              setT_Subject('');
                              setT_Topic('');
                            } else if (activeTab === 'visual') {
                              setV_Grade(val);
                              setV_Subject('');
                              setV_Topic('');
                            } else {
                              setA_Grade(val);
                              setA_Subject('');
                              setA_Topic('');
                            }
                          }}
                        >`
);

// We need to also remove the closing `)}`
code = code.replace(
  `                          ))}
                        </Select>
                      </div>
                    )}`,
  `                          ))}
                        </Select>
                      </div>`
);

fs.writeFileSync('src/components/ContentCreator.tsx', code);
