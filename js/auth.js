seedData();
function loggedIn(){return Boolean(readStore(KEYS.session,null)?.loggedIn)}
const onLogin=location.pathname.endsWith('login.html');
if(onLogin&&loggedIn())location.replace('index.html');
if(!onLogin&&!loggedIn())location.replace('login.html');
const loginForm=document.getElementById('loginForm');
if(loginForm){document.getElementById('togglePassword').onclick=()=>{const p=document.getElementById('password');p.type=p.type==='password'?'text':'password';document.getElementById('togglePassword').innerHTML=`<i data-lucide="${p.type==='password'?'eye':'eye-off'}"></i>`;lucide.createIcons()};loginForm.onsubmit=e=>{e.preventDefault();const s=getSettings(),u=document.getElementById('username').value.trim(),p=document.getElementById('password').value;if(u===s.username&&p===s.password){saveStore(KEYS.session,{loggedIn:true,remember:document.getElementById('remember').checked,loginAt:new Date().toISOString()});location.replace('index.html')}else document.getElementById('loginError').textContent='Incorrect username or password.'};lucide.createIcons()}
function signOut(){localStorage.removeItem(KEYS.session);location.replace('login.html')}
