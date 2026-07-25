const fs = require('fs');
let code = fs.readFileSync('src/components/ContentCreator.tsx', 'utf8');

const target = `                    </div>
                  </div>

                  {/* Embedded Advanced Section based on mode */}`;

const replacement = `                    </div>
                  </div>

                  {/* Admin Specific Fields */}
                  {activeTab === 'admin' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div>
                        <Label>School</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_school} onChange={(e: any) => setA_School(e.target.value)} placeholder="School Name" />
                      </div>
                      <div>
                        <Label>Time & Date</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_timeDate} onChange={(e: any) => setA_TimeDate(e.target.value)} placeholder="e.g. 15 Oct, 14:00" />
                      </div>
                      <div>
                        <Label>Recipient</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_recipient} onChange={(e: any) => setA_Recipient(e.target.value)} placeholder="e.g. Parents, Staff" />
                      </div>
                      <div>
                        <Label>Venue</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_venue} onChange={(e: any) => setA_Venue(e.target.value)} placeholder="e.g. School Hall" />
                      </div>
                      <div>
                        <Label>Class Teacher</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_classTeacher} onChange={(e: any) => setA_ClassTeacher(e.target.value)} placeholder="Teacher Name" />
                      </div>
                      <div>
                        <Label>School Principal</Label>
                        <Input isDarkMode={isDarkMode} type="text" value={a_schoolPrincipal} onChange={(e: any) => setA_SchoolPrincipal(e.target.value)} placeholder="Principal Name" />
                      </div>
                    </div>
                  )}

                  {/* Embedded Advanced Section based on mode */}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/ContentCreator.tsx', code);
