const packedCode = `eval(function(p,a,c,k,e,d){while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+c.toString(a)+'\\\\b','g'),k[c]);return p}('b 8f=[];b o={"1p":"1e://8m.gm-gl.22/1p/5a/8l/8k/8j.gk?t=gj-gi-gh&s=3w&e=gg&f=33&gf=49&i=0.4&ge=6m&gd=49&gc=49&gb=ga","1f":"1e://8m.g9.g8/49/1f/5a/8l/8k/8j.g7"};1l("g6").g5({g4:[{1t:o.1u||o.1f||o.1p,3i:"3h"}],g3:"1e://8h.cc/g2.8g",4u:"5i%",4t:"5i%",g1:"g0",fz:"8i.11",fy:'fx',fw:'6c',fv:{fu:{35:"#2q",ft:"#2q"},fs:{fr:"#2q"},fq:{35:"#2q"}},fp:"u",r:[{1t:"/dl?3x=fo&1s=8i&fn=1e://8h.cc/fm.8g",fl:"fk"}],5r:{fj:1,fi:'#fh',fg:5i,ff:'fe',fd:'fc',fb:0,},"fa":{"f9":"8d","f8":"f7"},'f6':{"f5":"f4"},f3:"f2",f1:"1e://f0.22",ez:{1t:"1e://ey.22/ex-2m/ew.ev","3y":q,1g:"1e://eu.et",1n:"es-er",eq:"5",3y:q},ep:u,5q:[0.25,0.5,0.75,1,1.25,1.5,2]});b 5d,5h;b eo=0,en=0,em=0;b k=1l();b 42=0,34=0,el=0,p=0;$.ek({ej:{'ei-eh':'eg-ef'}});k.1k('8e',j(x){a(5>0&&x.1n>=5&&5h!=1){5h=1;$('1m.ee').ed('ec')}b 5e=0;8f.eb(1c=>{a(1c.8e<=x.1n&&1c.87==0){a(1c.8b=='8d'){a(1c.1g.2n('1e://')){k.8c(1c.1g)}1d{b 45=40 5g().5f(1c.1g,"35/31");1c.1g="2m:ea/e9;e8,"+e7(e6(e5(45.e4.2l)));k.8c(1c.1g)}}1d a(1c.8b=='e3'){e2(5e,1c.1g)}1d{b 1r=40 5g().5f(1c.1g,"35/31").2y.2l;b 1h=1q.3v('1h');a(1r.2n('1e://')||1r.2n('2r://')||1r.2n('//')){1h.26=1r.2n('//')?2d.8a.89+1r:1r;1h.88=u}1d{b 45=40 5g().5f(1r,"35/31");b 28=45.e1('1h');a(28){a(28.26){1h.26=28.26.2n('//')?2d.8a.89+28.26:28.26;1h.88=u}1d{1h.2l=28.2l}}1d{1h.2l=1r}}1q.2y.3s(1h)}1c.87=1}5e++});a(x.1n>=p+5||x.1n<p){p=x.1n;1v.e0('2h',dz.dy(p),{dx:60*60*24*7})}a(1){dt=x.1n-42;a(dt>5)dt=1;34+=dt}42=x.1n;a(34>=60){$.dw('1e://dv.du.22/dl',{3x:'ds',5c:'33-3w-5b',dr:53(34),dq:33,dp:'39'},j(){},"do");34=0}});k.1k('2g',j(x){42=x.1n});k.1k('4x',j(x){85(x)});k.1k('dn',j(){$('1m.84').dm();1v.dk('2h')});k.1k('dj',j(x){});j di(2o,86,3o){b 3z=40 6x();3z.dh(3z.dg()+(3o*6y));1q.df=2o+"="+86+"; de="+3z.dd()+"; dc=.5u.22; 2f=/; db=da; d9"}j 85(x){$('1m.84').3y();$('#d8').3y();a(...`;

function unpackPacker(packed) {
  const match = packed.match(/eval\s*\(\s*function\s*\(p,a,c,k,e,(?:d|r)\)\s*\{[\s\S]*?\}\s*\(\s*['"]([^'"]*)['"],\s*(\d+),\s*(\d+),\s*['"]([^'"]*)['"]\s*\)/);
  if (!match) {
    console.log('No match found');
    // Try another pattern
    const match2 = packed.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*\}\('([^']*)',(\d+),(\d+),'([^']*)'\)/);
    if (match2) console.log('Match2:', match2.slice(1));
    return packed;
  }
  const [, p, a, c, k] = match;
  console.log('a:', a, 'c:', c);
  const keys = k.split('|');
  console.log('keys:', keys.length);
  let out = p;
  for (let i = a - 1; i >= 0; i--) {
    if (keys[i]) {
      const re = new RegExp('\\b' + i.toString(c) + '\\b', 'g');
      out = out.replace(re, keys[i]);
    }
  }
  return out;
}

const result = unpackPacker(packedCode);
console.log('RESULT:');
console.log(result.substring(0,3000));