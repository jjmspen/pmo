
(function(){
  function look(scope, path){
    path=path.trim();
    if(path==='true') return true; if(path==='false') return false;
    if(/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts=path.split('.'), v=scope;
    for(var i=0;i<parts.length;i++){ if(v==null) return undefined; v=v[parts[i]]; }
    return v;
  }
  var WHOLE=/^\s*\{\{([^}]+)\}\}\s*$/, ANY=/\{\{([^}]+)\}\}/g;
  function interp(str, scope){ return str.replace(ANY, function(_,p){ var v=look(scope,p); return v==null?'':String(v); }); }
  function renderNodes(nodes, scope, parent){
    for(var i=0;i<nodes.length;i++) renderNode(nodes[i], scope, parent);
  }
  function renderNode(node, scope, parent){
    if(node.nodeType===3){ parent.appendChild(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if(node.nodeType!==1) return;
    var tag=node.tagName.toLowerCase();
    if(tag==='sc-for'){
      var list=look(scope,(node.getAttribute('list')||'').replace(/[{}]/g,''))||[];
      var as=node.getAttribute('as')||'item';
      list.forEach(function(it,idx){ var s=Object.create(scope); s[as]=it; s.$index=idx; renderNodes(node.childNodes, s, parent); });
      return;
    }
    if(tag==='sc-if'){
      var v=look(scope,(node.getAttribute('value')||'').replace(/[{}]/g,''));
      if(v) renderNodes(node.childNodes, scope, parent);
      return;
    }
    var el=node.cloneNode(false);
    Array.prototype.slice.call(node.attributes).forEach(function(a){
      var name=a.name, val=a.value;
      if(name.indexOf('hint-')===0){ el.removeAttribute(name); return; }
      if(/^on[a-z]+$/i.test(name)){
        el.removeAttribute(name);
        var m=WHOLE.exec(val); if(m){ var fn=look(scope,m[1]); if(typeof fn==='function') el.addEventListener(name.slice(2).toLowerCase(), fn); }
        return;
      }
      if(val.indexOf('{{')>=0) el.setAttribute(name, interp(val, scope));
    });
    var kids = tag==='template' ? node.content.childNodes : node.childNodes;
    renderNodes(kids, scope, el);
    parent.appendChild(el);
  }
  var DCLogic=window.DCLogic=function(props){ this.props=props||{}; this.state={}; };
  DCLogic.prototype.setState=function(p){ for(var k in p) this.state[k]=p[k]; this._render&&this._render(); };
  DCLogic.prototype.forceUpdate=function(){ this._render&&this._render(); };
  window.mountDC=function(Comp){
    var tpl=document.getElementById('dc-template'), root=document.getElementById('dc-root');
    var c=new Comp({});
    c._render=function(){
      var saved=[].map.call(root.querySelectorAll('input,textarea,select'),function(i){return i.type==='checkbox'?i.checked:i.value;});
      var vals=c.renderVals()||{};
      var frag=document.createDocumentFragment();
      renderNodes(tpl.content.childNodes, vals, frag);
      root.innerHTML=''; root.appendChild(frag);
      [].forEach.call(root.querySelectorAll('input,textarea,select'),function(i,n){ if(n<saved.length){ if(i.type==='checkbox') i.checked=saved[n]; else i.value=saved[n]; }});
    };
    c._render();
    if(c.componentDidMount) c.componentDidMount();
  };
})();
