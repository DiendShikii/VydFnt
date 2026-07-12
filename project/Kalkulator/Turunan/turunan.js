const NUM0={type:'num',value:0}, NUM1={type:'num',value:1}, NUM2={type:'num',value:2}, NUM10={type:'num',value:10};

function containsVar(n){
    if(!n) return false;
    switch(n.type){
        case 'var': return true;
        case 'num': case 'const': return false;
        case 'neg': return containsVar(n.arg);
        case 'func': return containsVar(n.arg);
        case 'add': case 'sub': case 'mul': case 'div': case 'pow': return containsVar(n.a)||containsVar(n.b);
        default: return false;
    }
}
function isConstant(n){ return !containsVar(n); }
function exprKey(n){ return JSON.stringify(n); }
function splitCoeff(n){
    if(n.type==='num') return [n.value, null];
    if(n.type==='neg'){ const r=splitCoeff(n.arg); return [-r[0], r[1]]; }
    if(n.type==='mul' && n.a.type==='num') return [n.a.value, n.b];
    if(n.type==='mul' && n.b.type==='num') return [n.b.value, n.a];
    return [1, n];
}

function simplify(n){
    if(!n) return n;
    switch(n.type){
        case 'num': case 'var': case 'const': return n;
        case 'neg': {
            const a=simplify(n.arg);
            if(a.type==='num') return {type:'num', value:-a.value};
            if(a.type==='neg') return a.arg;
            return {type:'neg', arg:a};
        }
        case 'add': {
            let a=simplify(n.a), b=simplify(n.b);
            if(a.type==='num'&&a.value===0) return b;
            if(b.type==='num'&&b.value===0) return a;
            if(a.type==='num'&&b.type==='num') return {type:'num', value:a.value+b.value};
            if(b.type==='neg') return simplify({type:'sub', a, b:b.arg});
            if(b.type==='num'&&b.value<0) return simplify({type:'sub', a, b:{type:'num', value:-b.value}});
            const ca=splitCoeff(a), cb=splitCoeff(b);
            if(ca[1] && cb[1] && exprKey(ca[1])===exprKey(cb[1])){
                const c=ca[0]+cb[0];
                if(c===0) return {type:'num', value:0};
                if(c===1) return ca[1];
                if(c===-1) return {type:'neg', arg:ca[1]};
                return {type:'mul', a:{type:'num', value:c}, b:ca[1]};
            }
            return {type:'add', a, b};
        }
        case 'sub': {
            let a=simplify(n.a), b=simplify(n.b);
            if(b.type==='num'&&b.value===0) return a;
            if(a.type==='num'&&a.value===0) return simplify({type:'neg', arg:b});
            if(a.type==='num'&&b.type==='num') return {type:'num', value:a.value-b.value};
            if(exprKey(a)===exprKey(b)) return {type:'num', value:0};
            if(b.type==='neg') return simplify({type:'add', a, b:b.arg});
            return {type:'sub', a, b};
        }
        case 'mul': {
            let a=simplify(n.a), b=simplify(n.b);
            if((a.type==='num'&&a.value===0)||(b.type==='num'&&b.value===0)) return {type:'num', value:0};
            if(a.type==='num'&&a.value===1) return b;
            if(b.type==='num'&&b.value===1) return a;
            if(a.type==='num'&&b.type==='num') return {type:'num', value:a.value*b.value};
            if(a.type==='num'&&b.type==='mul'&&b.a.type==='num') return simplify({type:'mul', a:{type:'num',value:a.value*b.a.value}, b:b.b});
            if(b.type==='num'&&a.type==='mul'&&a.a.type==='num') return simplify({type:'mul', a:{type:'num',value:a.a.value*b.value}, b:a.b});
            if(a.type==='mul'&&a.a.type==='num'&&b.type==='mul'&&b.a.type==='num') return simplify({type:'mul', a:{type:'num',value:a.a.value*b.a.value}, b:{type:'mul',a:a.b,b:b.b}});
            if(a.type==='num'&&a.value===-1) return simplify({type:'neg', arg:b});
            if(b.type==='num'&&b.value===-1) return simplify({type:'neg', arg:a});
            if(a.type==='neg'&&b.type==='neg') return simplify({type:'mul', a:a.arg, b:b.arg});
            if(a.type==='neg') return simplify({type:'neg', arg:{type:'mul', a:a.arg, b}});
            if(b.type==='neg') return simplify({type:'neg', arg:{type:'mul', a, b:b.arg}});
            return {type:'mul', a, b};
        }
        case 'div': {
            let a=simplify(n.a), b=simplify(n.b);
            if(a.type==='num'&&a.value===0) return {type:'num', value:0};
            if(b.type==='num'&&b.value===1) return a;
            if(a.type==='num'&&b.type==='num'&&b.value!==0 && Number.isInteger(a.value/b.value)) return {type:'num', value:a.value/b.value};
            if(exprKey(a)===exprKey(b)) return {type:'num', value:1};
            return {type:'div', a, b};
        }
        case 'pow': {
            let a=simplify(n.a), b=simplify(n.b);
            if(b.type==='num'&&b.value===0) return {type:'num', value:1};
            if(b.type==='num'&&b.value===1) return a;
            if(a.type==='num'&&a.value===0) return {type:'num', value:0};
            if(a.type==='num'&&a.value===1) return {type:'num', value:1};
            if(a.type==='num'&&b.type==='num') return {type:'num', value:Math.pow(a.value,b.value)};
            return {type:'pow', a, b};
        }
        case 'func': {
            let arg=simplify(n.arg);
            if(arg.type==='num'){
                if(n.name==='sin'&&arg.value===0) return {type:'num',value:0};
                if(n.name==='cos'&&arg.value===0) return {type:'num',value:1};
                if(n.name==='ln'&&arg.value===1) return {type:'num',value:0};
                if(n.name==='sqrt'&&arg.value===0) return {type:'num',value:0};
                if(n.name==='exp'&&arg.value===0) return {type:'num',value:1};
            }
            return {type:'func', name:n.name, arg};
        }
        default: return n;
    }
}

const KEYWORDS=['sqrt','sin','cos','tan','exp','log','ln','pi','e','x'];
function tokenize(str){
    const tokens=[];
    const s=str.replace(/\s+/g,'');
    if(!s) throw new Error('Masukkan sebuah fungsi terlebih dahulu.');
    let i=0;
    while(i<s.length){
        const c=s[i];
        if(/[0-9.]/.test(c)){
            let j=i; while(j<s.length && /[0-9.]/.test(s[j])) j++;
            tokens.push({type:'num', value:parseFloat(s.slice(i,j))});
            i=j; continue;
        }
        if(/[a-zA-Z]/.test(c)){
            let matched=null;
            for(const kw of KEYWORDS){
                if(s.substr(i,kw.length).toLowerCase()===kw){ matched=kw; break; }
            }
            if(matched){ tokens.push({type:'ident', value:matched}); i+=matched.length; }
            else { tokens.push({type:'ident', value:s[i]}); i++; }
            continue;
        }
        if('+-*/^(),'.includes(c)){ tokens.push({type:c}); i++; continue; }
        throw new Error('Karakter tidak dikenali: "'+c+'"');
    }
    return tokens;
}

function Parser(tokens){
    let pos=0;
    const peek=()=>tokens[pos];
    const next=()=>tokens[pos++];
    const expect=(t)=>{ if(!peek()||peek().type!==t) throw new Error('Format penulisan kurang tepat, cek kembali tanda kurungnya.'); next(); };
    function startsFactor(tok){ return !!tok && (tok.type==='num'||tok.type==='ident'||tok.type==='('); }
    function parseExpr(){
        let node=parseTerm();
        while(peek() && (peek().type==='+'||peek().type==='-')){
            const op=next().type;
            const rhs=parseTerm();
            node = op==='+' ? {type:'add',a:node,b:rhs} : {type:'sub',a:node,b:rhs};
        }
        return node;
    }
    function parseTerm(){
        let node=parseUnary();
        while(peek() && (peek().type==='*'||peek().type==='/'||startsFactor(peek()))){
            if(peek().type==='*'){ next(); node={type:'mul',a:node,b:parseUnary()}; }
            else if(peek().type==='/'){ next(); node={type:'div',a:node,b:parseUnary()}; }
            else { node={type:'mul', a:node, b:parseUnary()}; }
        }
        return node;
    }
    function parseUnary(){
        if(peek() && peek().type==='-'){ next(); return {type:'neg', arg:parseUnary()}; }
        if(peek() && peek().type==='+'){ next(); return parseUnary(); }
        return parsePow();
    }
    function parsePow(){
        let node=parsePrimary();
        if(peek() && peek().type==='^'){ next(); const exp=parseUnary(); node={type:'pow', a:node, b:exp}; }
        return node;
    }
    function parsePrimary(){
        const tok=peek();
        if(!tok) throw new Error('Penulisan fungsi belum lengkap.');
        if(tok.type==='num'){ next(); return {type:'num', value:tok.value}; }
        if(tok.type==='('){ next(); const e=parseExpr(); expect(')'); return e; }
        if(tok.type==='ident'){
            const name=tok.value;
            if(name==='x'){ next(); return {type:'var'}; }
            if(name==='e'){ next(); return {type:'const', name:'e'}; }
            if(name==='pi'){ next(); return {type:'const', name:'pi'}; }
            next();
            if(peek() && peek().type==='('){ next(); const arg=parseExpr(); expect(')'); return {type:'func', name, arg}; }
            const arg=parseUnary();
            return {type:'func', name, arg};
        }
        throw new Error('Ada bagian yang tidak dikenali dalam penulisan fungsi.');
    }
    const ast=parseExpr();
    if(pos<tokens.length) throw new Error('Ada karakter tersisa yang tidak dapat dibaca. Cek kembali tanda kurung atau operatornya.');
    return ast;
}
function parseInput(str){ return Parser(tokenize(str)); }

function diffSteps(node, steps){
    let result;
    switch(node.type){
        case 'num': case 'const': result=NUM0; steps.push('Turunan dari konstanta <b>'+html(node)+'</b> adalah <b>0</b> — aturan konstanta.'); break;
        case 'var': result=NUM1; steps.push('Turunan dari <b>x</b> adalah <b>1</b> — aturan dasar variabel.'); break;
        case 'neg': {
            const d=diffSteps(node.arg, steps);
            result=simplify({type:'neg', arg:d});
            steps.push('Turunan dari −'+html(node.arg)+' adalah −('+html(d)+') = <b>'+html(result)+'</b>.');
            break;
        }
        case 'add': {
            const da=diffSteps(node.a, steps), db=diffSteps(node.b, steps);
            result=simplify({type:'add', a:da, b:db});
            steps.push('<b>Aturan Jumlah:</b> turunan dari '+html(node.a)+' + '+html(node.b)+' adalah ('+html(da)+') + ('+html(db)+') = <b>'+html(result)+'</b>.');
            break;
        }
        case 'sub': {
            const da=diffSteps(node.a, steps), db=diffSteps(node.b, steps);
            result=simplify({type:'sub', a:da, b:db});
            steps.push('<b>Aturan Selisih:</b> turunan dari '+html(node.a)+' − '+html(node.b)+' adalah ('+html(da)+') − ('+html(db)+') = <b>'+html(result)+'</b>.');
            break;
        }
        case 'mul': {
            if(isConstant(node.a)){
                const db=diffSteps(node.b, steps);
                result=simplify({type:'mul', a:node.a, b:db});
                steps.push('<b>Aturan Kelipatan Konstanta:</b> turunan dari '+html(node.a)+'·'+html(node.b)+' adalah '+html(node.a)+'·('+html(db)+') = <b>'+html(result)+'</b>.');
            } else if(isConstant(node.b)){
                const da=diffSteps(node.a, steps);
                result=simplify({type:'mul', a:da, b:node.b});
                steps.push('<b>Aturan Kelipatan Konstanta:</b> turunan dari '+html(node.b)+'·'+html(node.a)+' adalah '+html(node.b)+'·('+html(da)+') = <b>'+html(result)+'</b>.');
            } else {
                const da=diffSteps(node.a, steps), db=diffSteps(node.b, steps);
                result=simplify({type:'add', a:{type:'mul',a:da,b:node.b}, b:{type:'mul',a:node.a,b:db}});
                steps.push('<b>Aturan Hasil Kali:</b> (u·v)′ = u′v + uv′, dengan u = '+html(node.a)+' dan v = '+html(node.b)+' → <b>'+html(result)+'</b>.');
            }
            break;
        }
        case 'div': {
            const da=diffSteps(node.a, steps), db=diffSteps(node.b, steps);
            result=simplify({type:'div', a:{type:'sub', a:{type:'mul',a:da,b:node.b}, b:{type:'mul',a:node.a,b:db}}, b:{type:'pow', a:node.b, b:NUM2}});
            steps.push('<b>Aturan Hasil Bagi:</b> (u/v)′ = (u′v − uv′)/v², dengan u = '+html(node.a)+' dan v = '+html(node.b)+' → <b>'+html(result)+'</b>.');
            break;
        }
        case 'pow': {
            if(!containsVar(node.b)){
                const nExp=node.b;
                const da=diffSteps(node.a, steps);
                result=simplify({type:'mul', a:{type:'mul', a:nExp, b:{type:'pow', a:node.a, b:simplify({type:'sub', a:nExp, b:NUM1})}}, b:da});
                steps.push('<b>Aturan Pangkat:</b> d/dx[uⁿ] = n·u⁽ⁿ⁻¹⁾·u′, dengan u = '+html(node.a)+' dan n = '+html(nExp)+' → <b>'+html(result)+'</b>.');
            } else if(node.a.type==='const' && node.a.name==='e'){
                const db=diffSteps(node.b, steps);
                result=simplify({type:'mul', a:node, b:db});
                steps.push('<b>Aturan Eksponensial:</b> d/dx[eᵘ] = eᵘ·u′, dengan u = '+html(node.b)+' → <b>'+html(result)+'</b>.');
            } else {
                const da=diffSteps(node.a, steps), db=diffSteps(node.b, steps);
                result=simplify({type:'mul', a:node, b:{type:'add', a:{type:'mul', a:db, b:{type:'func', name:'ln', arg:node.a}}, b:{type:'div', a:{type:'mul', a:node.b, b:da}, b:node.a}}});
                steps.push('<b>Aturan Pangkat Umum:</b> basis maupun pangkat mengandung x, digunakan turunan logaritmik → <b>'+html(result)+'</b>.');
            }
            break;
        }
        case 'func': {
            const du=diffSteps(node.arg, steps);
            let base, ruleName;
            switch(node.name){
                case 'sin': base={type:'func',name:'cos',arg:node.arg}; ruleName='d/dx[sin(u)] = cos(u)·u′'; break;
                case 'cos': base={type:'neg', arg:{type:'func',name:'sin',arg:node.arg}}; ruleName='d/dx[cos(u)] = −sin(u)·u′'; break;
                case 'tan': base={type:'div', a:NUM1, b:{type:'pow',a:{type:'func',name:'cos',arg:node.arg},b:NUM2}}; ruleName='d/dx[tan(u)] = u′/cos²(u)'; break;
                case 'ln': base={type:'div', a:NUM1, b:node.arg}; ruleName='d/dx[ln(u)] = u′/u'; break;
                case 'log': base={type:'div', a:NUM1, b:{type:'mul',a:node.arg,b:{type:'func',name:'ln',arg:NUM10}}}; ruleName='d/dx[log(u)] = u′/(u·ln 10)'; break;
                case 'sqrt': base={type:'div', a:NUM1, b:{type:'mul',a:NUM2,b:{type:'func',name:'sqrt',arg:node.arg}}}; ruleName='d/dx[√u] = u′/(2√u)'; break;
                case 'exp': base={type:'func',name:'exp',arg:node.arg}; ruleName='d/dx[exp(u)] = exp(u)·u′'; break;
            }
            result=simplify({type:'mul', a:base, b:du});
            const chain=(node.arg.type!=='var')?' (memakai Aturan Rantai karena isinya bukan hanya x)':'';
            steps.push('Gunakan <b>'+ruleName+'</b>'+chain+', dengan u = '+html(node.arg)+' → <b>'+html(result)+'</b>.');
            break;
        }
                default: throw new Error('Bagian fungsi tidak dikenali.');
    }
    return result;
}

function fmtNum(v){
    if(Number.isInteger(v)) return v.toString();
    let s=v.toFixed(4).replace(/0+$/,'').replace(/\.$/,'');
    return s;
}
function wrap(s,c){ return c? '('+s+')': s; }
function html(n, parentPrec){
    parentPrec=parentPrec||0;
    switch(n.type){
        case 'num': return n.value<0? '−'+fmtNum(-n.value): fmtNum(n.value);
        case 'var': return 'x';
        case 'const': return n.name==='e'?'e':'π';
        case 'neg': { const s='−'+html(n.arg,2); return wrap(s, parentPrec>1); }
        case 'add': {
            let bNode=n.b, opStr=' + ', bStr;
            if(bNode.type==='neg'){ opStr=' − '; bStr=html(bNode.arg,1); }
            else if(bNode.type==='num'&&bNode.value<0){ opStr=' − '; bStr=fmtNum(-bNode.value); }
            else bStr=html(bNode,1);
            const s=html(n.a,1)+opStr+bStr; return wrap(s, parentPrec>1);
        }
        case 'sub': { const s=html(n.a,1)+' − '+html(n.b,1.5); return wrap(s, parentPrec>1); }
        case 'mul': {
            const bStartsVarLike=(n.b.type==='var')||(n.b.type==='pow'&&n.b.a.type==='var')||(n.b.type==='const');
            const sep=(n.a.type==='num'&&bStartsVarLike)?'':'·';
            const s=html(n.a,2)+sep+html(n.b,2); return wrap(s, parentPrec>2);
        }
        case 'div': { const s=html(n.a,2)+' / '+html(n.b,2.5); return wrap(s, parentPrec>2); }
        case 'pow': {
            const base=html(n.a,3.1);
            const expNeedsParen=!(n.b.type==='num'||n.b.type==='var'||n.b.type==='const');
            const exp=html(n.b,0);
            const s=base+'<sup>'+(expNeedsParen?'('+exp+')':exp)+'</sup>'; return wrap(s, parentPrec>3);
        }
        case 'func': {
            if(n.name==='sqrt') return '√('+html(n.arg,1)+')';
            return n.name+'('+html(n.arg,1)+')';
        }
    }
}

function plain(n, parentPrec){
    parentPrec=parentPrec||0;
    switch(n.type){
        case 'num': return n.value<0? '-'+fmtNum(-n.value): fmtNum(n.value);
        case 'var': return 'x';
        case 'const': return n.name==='e'?'e':'pi';
        case 'neg': { const s='-'+plain(n.arg,2); return wrap(s, parentPrec>1); }
        case 'add': {
            let bNode=n.b, opStr=' + ', bStr;
            if(bNode.type==='neg'){ opStr=' - '; bStr=plain(bNode.arg,1); }
            else if(bNode.type==='num'&&bNode.value<0){ opStr=' - '; bStr=fmtNum(-bNode.value); }
            else bStr=plain(bNode,1);
            const s=plain(n.a,1)+opStr+bStr; return wrap(s, parentPrec>1);
        }
        case 'sub': { const s=plain(n.a,1)+' - '+plain(n.b,1.5); return wrap(s, parentPrec>1); }
        case 'mul': {
            const bStartsVarLike=(n.b.type==='var')||(n.b.type==='pow'&&n.b.a.type==='var')||(n.b.type==='const');
            const sep=(n.a.type==='num'&&bStartsVarLike)?'':'*';
            const s=plain(n.a,2)+sep+plain(n.b,2); return wrap(s, parentPrec>2);
        }
        case 'div': { const s=plain(n.a,2)+'/'+plain(n.b,2.5); return wrap(s, parentPrec>2); }
        case 'pow': {
            const base=plain(n.a,3.1);
            const expNeedsParen=!(n.b.type==='num'||n.b.type==='var'||n.b.type==='const');
            const exp=plain(n.b,0);
            const s=base+'^'+(expNeedsParen?'('+exp+')':exp); return wrap(s, parentPrec>3);
        }
        case 'func': { const nm=n.name==='sqrt'?'sqrt':n.name; return nm+'('+plain(n.arg,1)+')'; }
    }
}

function evaluate(n, xv){
    switch(n.type){
        case 'num': return n.value;
        case 'var': return xv;
        case 'const': return n.name==='e'?Math.E:Math.PI;
        case 'neg': return -evaluate(n.arg,xv);
        case 'add': return evaluate(n.a,xv)+evaluate(n.b,xv);
        case 'sub': return evaluate(n.a,xv)-evaluate(n.b,xv);
        case 'mul': return evaluate(n.a,xv)*evaluate(n.b,xv);
        case 'div': return evaluate(n.a,xv)/evaluate(n.b,xv);
        case 'pow': return Math.pow(evaluate(n.a,xv), evaluate(n.b,xv));
        case 'func': {
            const v=evaluate(n.arg,xv);
            switch(n.name){
                case 'sin': return Math.sin(v);
                case 'cos': return Math.cos(v);
                case 'tan': return Math.tan(v);
                case 'ln': return Math.log(v);
                case 'log': return Math.log10(v);
                case 'sqrt': return Math.sqrt(v);
                case 'exp': return Math.exp(v);
            }
        }
    }
}

const insertChips=[
    ['x','x'], ['x²','x^2'], ['xⁿ','x^'], ['√','sqrt()'], ['sin','sin()'],
    ['cos','cos()'], ['tan','tan()'], ['ln','ln()'], ['log','log()'],
    ['eˣ','e^x'], ['π','pi'], ['(',' ('], [')',')']
];
const examples=[
    '2x^3 + 5x^2 - 3x + 7',
'sin(x) * cos(x)',
'x^2 / (x + 1)',
'e^(2x) + ln(x)',
'sqrt(x^2 + 1)',
'3x^4 - 2^x'
];

const insertWrap=document.getElementById('insertChips');
insertChips.forEach(([label, val])=>{
    const b=document.createElement('button');
    b.className='chip'; b.type='button'; b.textContent=label;
    b.addEventListener('click', ()=>insertAtCursor(val));
    insertWrap.appendChild(b);
});
const exampleWrap=document.getElementById('exampleChips');
examples.forEach(ex=>{
    const b=document.createElement('button');
    b.className='chip example'; b.type='button'; b.textContent=ex;
    b.addEventListener('click', ()=>{ input.value=ex; input.focus(); });
    exampleWrap.appendChild(b);
});

const input=document.getElementById('exprInput');
const results=document.getElementById('results');
const errorBox=document.getElementById('errorBox');

function insertAtCursor(text){
    const start=input.selectionStart ?? input.value.length;
    const end=input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0,start) + text + input.value.slice(end);
    const newPos = start + text.length;
    input.focus();
    input.setSelectionRange(newPos, newPos);
}

function showError(msg){
    errorBox.textContent=msg;
    errorBox.style.display='block';
}
function clearError(){
    errorBox.style.display='none';
    errorBox.textContent='';
}

let orderCount=0;
let latestAst=null;

function labelFor(order){
    if(order===1) return "f′(x)";
    if(order===2) return "f″(x)";
    if(order===3) return "f‴(x)";
    return "f<sup>("+order+")</sup>(x)";
}

function startSolve(){
    clearError();
    const raw=input.value.trim();
    if(!raw){ showError('Masukkan sebuah fungsi terlebih dahulu, misalnya 2x^2 + 5x'); return; }
    let ast;
    try{
        ast=parseInput(raw);
    }catch(e){
        showError(e.message || 'Format fungsi tidak dikenali. Periksa kembali penulisannya.');
        return;
    }
    results.innerHTML='';
    orderCount=0;
    latestAst=ast;
    renderOriginCard(ast);
    runDifferentiation();
}

function renderOriginCard(ast){
    const block=document.createElement('div');
    block.className='order-block';
    block.innerHTML = `
    <div class="badge-col">
    <div class="badge origin">f</div>
    <div class="thread"></div>
    </div>
    <div class="panel order-card">
    <p class="order-title">Fungsi asal</p>
    <div class="result-line">f(x) = ${html(simplify(ast))}</div>
    </div>
    `;
    results.appendChild(block);
}

function runDifferentiation(){
    const steps=[];
    let deriv;
    try{
        deriv=diffSteps(latestAst, steps);
    }catch(e){
        showError('Terjadi kesalahan saat menurunkan fungsi ini. Coba sederhanakan penulisannya.');
        return;
    }
    orderCount++;
    latestAst=deriv;
    removeActionsFromLastCard();
    renderOrderCard(orderCount, deriv, steps);
}

function removeActionsFromLastCard(){
    const prevActions=results.querySelectorAll('.next-actions');
    prevActions.forEach(el=>el.remove());
}

function renderOrderCard(order, deriv, steps){
    const isLast=true;
    const block=document.createElement('div');
    block.className='order-block';

    const badgeCol=document.createElement('div');
    badgeCol.className='badge-col';
    badgeCol.innerHTML=`<div class="badge result">${order<=3?order:order}</div><div class="thread"></div>`;
    block.appendChild(badgeCol);

    const card=document.createElement('div');
    card.className='panel order-card';

    const title=document.createElement('p');
    title.className='order-title';
    title.textContent='Turunan ke-'+order;
    card.appendChild(title);

    const resultLine=document.createElement('div');
    resultLine.className='result-line';
    resultLine.innerHTML=labelFor(order)+' = '+html(deriv);
    card.appendChild(resultLine);

    if(steps.length){
        const det=document.createElement('details');
        det.className='steps';
        det.open=true;
        const summary=document.createElement('summary');
        summary.textContent='Lihat langkah-langkah penyelesaian';
        det.appendChild(summary);
        const ul=document.createElement('ul');
        ul.className='step-list';
        steps.forEach((s,i)=>{
            const li=document.createElement('li');
            li.className='inset';
            li.innerHTML='<span class="step-num">'+(i+1)+'.</span>'+s;
            ul.appendChild(li);
        });
        det.appendChild(ul);
        card.appendChild(det);
    }

    const finalBox=document.createElement('div');
    finalBox.className='final-box inset';
    const plainText = (order===1?'f\'(x) = ':'') + plain(deriv);
    finalBox.innerHTML = `<span class="val">= ${html(deriv)}</span><button class="copy-btn" title="Salin hasil">⧉</button>`;
    finalBox.querySelector('.copy-btn').addEventListener('click', (e)=>{
        navigator.clipboard.writeText(plain(deriv)).then(()=>{
            const btn=e.currentTarget;
            btn.classList.add('copied'); btn.textContent='✓';
            setTimeout(()=>{ btn.classList.remove('copied'); btn.textContent='⧉'; }, 1300);
        });
    });
    card.appendChild(finalBox);

    const actions=document.createElement('div');
    actions.className='next-actions';
    const canContinue = containsVar(deriv) || (deriv.type==='num' && deriv.value!==0) ? true : true;
    const isZero = deriv.type==='num' && deriv.value===0;
    if(!isZero){
        const againBtn=document.createElement('button');
        againBtn.className='btn btn-ghost btn-small';
        againBtn.textContent='Turunkan Lagi ↓';
        againBtn.addEventListener('click', runDifferentiation);
        actions.appendChild(againBtn);
    }

    const evalTool=document.createElement('div');
    evalTool.className='inset eval-tool';
    evalTool.innerHTML=`<span>hitung di x =</span><input type="text" placeholder="0" class="evalInput"><span class="eval-result"></span>`;
    const evalInput=evalTool.querySelector('.evalInput');
    const evalOut=evalTool.querySelector('.eval-result');
    function doEval(){
        const v=parseFloat(evalInput.value);
        if(isNaN(v)){ evalOut.textContent=''; return; }
        const r=evaluate(deriv, v);
        evalOut.textContent='= '+ (Number.isFinite(r) ? (Math.round(r*10000)/10000) : 'tak terdefinisi');
    }
    evalInput.addEventListener('input', doEval);
    actions.appendChild(evalTool);

    card.appendChild(actions);
    block.appendChild(card);
    results.appendChild(block);

    block.scrollIntoView({behavior:'smooth', block:'nearest'});
}

document.getElementById('solveBtn').addEventListener('click', startSolve);
document.getElementById('clearBtn').addEventListener('click', ()=>{
    input.value='';
    results.innerHTML='';
    clearError();
    orderCount=0;
    latestAst=null;
    input.focus();
});
input.addEventListener('keydown', (e)=>{
    if(e.key==='Enter') startSolve();
});
