import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sourceRevision=git('rev-parse','HEAD');
const release=JSON.parse(await fs.readFile('release.json','utf8'));
async function localReservation(){
 const directory=path.join(git('rev-parse','--git-dir'),'multiview-builds');await fs.mkdir(directory,{recursive:true});const lock=path.join(directory,'lock');
 for(let i=0;;i++){try{await fs.mkdir(lock);break;}catch(e){if(e.code!=='EEXIST'||i>100)throw e;await new Promise(r=>setTimeout(r,20));}}
 try{let ledger;try{ledger=JSON.parse(await fs.readFile(path.join(directory,'ledger.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;ledger={scope:`local-${randomUUID()}`,ordinal:0};}ledger.ordinal++;await fs.writeFile(path.join(directory,'ledger.json'),JSON.stringify(ledger));return ledger;}finally{await fs.rmdir(lock);}
}
async function ciReservation(){
 const event=JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH,'utf8'));const pr=event.pull_request?.number;const scope=pr?`pr-${pr}`:'main';const repo=process.env.GITHUB_REPOSITORY;const token=process.env.GITHUB_TOKEN;
 if(!token)throw Error('CI builds require a token for the durable ordinal ledger.');
 const api=async (suffix,options={})=>fetch(`https://api.github.com/repos/${repo}/${suffix}`,{...options,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json',...options.headers}});
 for(let retry=0;retry<12;retry++){const res=await api(`git/matching-refs/tags/build-ledger/${scope}/`);if(!res.ok)throw Error(`Read build ledger: HTTP ${res.status}`);const refs=await res.json();const ordinal=1+Math.max(0,...refs.map(r=>Number(r.ref.split('/').at(-1))).filter(Number.isFinite));const create=await api('git/refs',{method:'POST',body:JSON.stringify({ref:`refs/tags/build-ledger/${scope}/${String(ordinal).padStart(6,'0')}`,sha:sourceRevision})});if(create.ok)return{scope,ordinal,pr:pr??null,prHead:event.pull_request?.head.sha??null};if(create.status!==422)throw Error(`Reserve build ordinal: HTTP ${create.status}`);}
 throw Error('Could not reserve a unique build ordinal.');
}
const identity=process.env.GITHUB_ACTIONS==='true'?await ciReservation():await localReservation();
const dirty=Boolean(git('status','--porcelain','--untracked-files=normal'));
const hash=createHash('sha256');
async function hashFiles(p){const st=await fs.stat(p);if(st.isDirectory()){for(const n of (await fs.readdir(p)).sort())await hashFiles(path.join(p,n));}else{hash.update(p);hash.update(await fs.readFile(p));}}
for(const p of ['dist','scripts','release.json','.github/workflows/pages.yml'])await hashFiles(p);
const fingerprint=hash.digest('hex');
const builtAt=new Date().toISOString();
const stamp=builtAt.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const id=`${release.version}_${release.slug}_${identity.scope}_build-${String(identity.ordinal).padStart(3,'0')}_${stamp}_g${sourceRevision.slice(0,12)}${dirty?`-dirty-${fingerprint.slice(0,10)}`:''}_web`;
const output=path.join('builds',id);
console.log(`BUILD START ${id}`);
try{
 await fs.mkdir(output,{recursive:true});await fs.cp('dist',output,{recursive:true});
 const manifest={id,...release,...identity,builtAt,sourceRevision,dirty,sourceFingerprint:fingerprint,target:'web'};
 await fs.writeFile(path.join(output,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const html=await fs.readFile(path.join(output,'index.html'),'utf8');await fs.writeFile(path.join(output,'index.html'),html.replace(/(<span id="build-identity" class="version">)[^<]*(<\/span>)/,`$1${id}$2`));
 await fs.writeFile(path.join(output,'BUILD-REPORT.md'),`# Build Report\n\nBuild: ${id}\n\nSource: ${sourceRevision}\n\nBuilt At: ${builtAt}\n\nStatus: Packaged; validation is recorded by the invoking checks.\n`);
 await fs.writeFile('builds/latest.json',JSON.stringify({id,path:output,manifest},null,2)+'\n');
 if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,`id=${id}\npath=${output}\n`);
 if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## Review Build\n\n\`${id}\`\n\nSource: \`${sourceRevision}\`\n`);
 console.log(`BUILD SUCCESS ${id}`);
}catch(e){console.error(`BUILD FAILED ${id}`);throw e;}
