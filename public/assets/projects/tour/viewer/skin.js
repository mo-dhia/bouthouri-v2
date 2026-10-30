// Garden Gnome Software - Skin
// Pano2VR 6.1.14/18105
// Filename: 03-02-AM.ggsk
// Generated 2022-10-29T21:09:01

function pano2vrSkin(player,base) {
	var me=this;
	var skin=this;
	var flag=false;
	var skinKeyPressed = 0;
	this.player=player;
	this.player.skinObj=this;
	this.divSkin=player.divSkin;
	this.ggUserdata=player.userdata;
	this.lastSize={ w: -1,h: -1 };
	var basePath="";
	// auto detect base path
	if (base=='?') {
		var scripts = document.getElementsByTagName('script');
		for(var i=0;i<scripts.length;i++) {
			var src=scripts[i].src;
			if (src.indexOf('skin.js')>=0) {
				var p=src.lastIndexOf('/');
				if (p>=0) {
					basePath=src.substr(0,p+1);
				}
			}
		}
	} else
	if (base) {
		basePath=base;
	}
	this.elementMouseDown=[];
	this.elementMouseOver=[];
	var cssPrefix='';
	var domTransition='transition';
	var domTransform='transform';
	var prefixes='Webkit,Moz,O,ms,Ms'.split(',');
	var i;
	var hs,el,els,elo,ela,elHorScrollFg,elHorScrollBg,elVertScrollFg,elVertScrollBg,elCornerBg;
	if (typeof document.body.style['transform'] == 'undefined') {
		for(var i=0;i<prefixes.length;i++) {
			if (typeof document.body.style[prefixes[i] + 'Transform'] !== 'undefined') {
				cssPrefix='-' + prefixes[i].toLowerCase() + '-';
				domTransition=prefixes[i] + 'Transition';
				domTransform=prefixes[i] + 'Transform';
			}
		}
	}
	
	player.setMargins(0,0,0,0);
	
	this.updateSize=function(startElement) {
		var stack=[];
		stack.push(startElement);
		while(stack.length>0) {
			var e=stack.pop();
			if (e.ggUpdatePosition) {
				e.ggUpdatePosition();
			}
			if (e.hasChildNodes()) {
				for(var i=0;i<e.childNodes.length;i++) {
					stack.push(e.childNodes[i]);
				}
			}
		}
	}
	
	this.callNodeChange=function(startElement) {
		var stack=[];
		stack.push(startElement);
		while(stack.length>0) {
			var e=stack.pop();
			if (e.ggNodeChange) {
				e.ggNodeChange();
			}
			if (e.hasChildNodes()) {
				for(var i=0;i<e.childNodes.length;i++) {
					stack.push(e.childNodes[i]);
				}
			}
		}
	}
	player.addListener('changenode', function() { me.ggUserdata=player.userdata; me.callNodeChange(me.divSkin); });
	
	var parameterToTransform=function(p) {
		var hs='translate(' + p.rx + 'px,' + p.ry + 'px) rotate(' + p.a + 'deg) scale(' + p.sx + ',' + p.sy + ')';
		return hs;
	}
	
	this.findElements=function(id,regex) {
		var r=[];
		var stack=[];
		var pat=new RegExp(id,'');
		stack.push(me.divSkin);
		while(stack.length>0) {
			var e=stack.pop();
			if (regex) {
				if (pat.test(e.ggId)) r.push(e);
			} else {
				if (e.ggId==id) r.push(e);
			}
			if (e.hasChildNodes()) {
				for(var i=0;i<e.childNodes.length;i++) {
					stack.push(e.childNodes[i]);
				}
			}
		}
		return r;
	}
	
	this.addSkin=function() {
		var hs='';
		this.ggCurrentTime=new Date().getTime();
		el=me._container_1=document.createElement('div');
		el.ggId="Container 1";
		el.ggDx=0;
		el.ggDy=42;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_container ";
		el.ggType='container';
		hs ='';
		hs+='height : 9%;';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : inherit;';
		hs+='width : calc(18rem  +  16vw);';
		hs+='pointer-events:none;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._container_1.ggIsActive=function() {
			return false;
		}
		el.ggElementNodeId=function() {
			return player.getCurrentNode();
		}
		me._container_1.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		el=me._svg_2=document.createElement('div');
		els=me._svg_2__img=document.createElement('img');
		els.className='ggskin ggskin_svg';
		hs='data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTk4NC4yNSAxOTg0LjI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGRlZnM+CiAgPHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7c3Ryb2tlOiNmZmY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOjEwcHg7fTwvc3R5bGU+CiA8L2RlZnM+CiA8ZyBkYXRhLW5hbWU9IkxheWVyIDIiIGlkPSJMYXllcl8yIj4KICA8ZyBkYXRhLW5hbWU9IkNhcGEgMiIgaWQ9IkNhcGFfMiI+CiAgIDxjaXJjbGUgY3k9Ijk5Mi4xMyIgcj0iOTkyLjEzIiBjeD0iOTkyLjEzIi8+CiAgIDxwYXRoIGQ9Ik0xNDc4LjYyLDk5Mi4xMXEwLDE3OC42MiwwLD'+
			'M1Ny4yNGMwLDc3LjQ5LTUxLjg2LDEyOS4zNy0xMjkuMzEsMTI5LjM3cS0zNTcuMTgsMC03MTQuMzcsMGMtNzcuNDMsMC0xMjkuMzMtNTEuOS0xMjkuMzMtMTI5LjM0cTAtMzU5LjYxLDAtNzE5LjIzYzAtNTguOTQsMzYuNzMtMTA2LjY3LDkyLjkyLTEyMC42OGExMzIuMzUsMTMyLjM1LDAsMCwxLDMxLjYtMy43N3EzNjEuOTQtLjMxLDcyMy44Ni0uMTFjNzEuMDYsMCwxMjQuNDUsNTMuNDUsMTI0LjU1LDEyNC41MlExNDc4Ljg2LDgxMS4xMiwxNDc4LjYyLDk5Mi4xMVpNOTkwLjg3LDE0MjkuMjVxMTgxLDAsMzYxLjk1LDBjNDYuMTMsMCw3Ni4yOC0zMC4zLDc2LjI5LTc2LjUzcS4wOS0zNjAuODEs'+
			'MC03MjEuNjNjMC00NS40OS0zMC4yOS03Ni03NS42LTc2cS0zNjEuMzUtLjEyLTcyMi43LDBjLTQ1LjM5LDAtNzUuNjgsMzAuNDUtNzUuNjksNzUuOXEtLjA5LDM2MS40MSwwLDcyMi44M2MwLDUuODkuMTMsMTEuOTQsMS40LDE3LjY1LDcuODcsMzUuMjMsMzUuODYsNTcuNzEsNzIuMzksNTcuNzVRODA5LjkxLDE0MjkuNCw5OTAuODcsMTQyOS4yNVoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNMTE3Ni40MSw4NDUuODNxMzEuODUsMCw2My42OCwwYzIzLjMzLDAsNDYuNjctLjIyLDcwLC4zNiwxMywuMzIsMjIsMTAuMTksMjIuNDYsMjIuODcuNDUsMTMuMDgtNy4zNSwyMi44My0yMC4yNy'+
			'wyNWE3NSw3NSwwLDAsMS0xMS44MS43MnEtODksLjA2LTE3Ny45NCwwYy0yNS4zNCwwLTMzLjM1LTgtMzMuMzctMzMuMzZxLS4wOC04OC4zOSwwLTE3Ni43OWE3OC44NSw3OC44NSwwLDAsMSwuNjktMTEuODFjMi4xLTEzLjcsMTEuOS0yMS44MywyNS4zMi0yMS4zMiwxMy4wNy41LDIyLjY5LDkuOSwyMi44MSwyMy44MS4zNCw0MCwuMTgsNzkuODkuMjEsMTE5Ljg0djEyLjYxbDUuMTEsNGMyLTMuODYsMy4xMi04LjUyLDYtMTEuNDUsNDUuNjgtNDYsOTEuNDItOTIsMTM3LjY2LTEzNy40OSw1LjQ1LTUuMzYsMTMuNjItOS4zLDIxLjE2LTEwLjg2LDkuODEtMiwxNy40Myw0LDIxLjg5LDEyLjg0czMu'+
			'NzMsMTcuNjQtMi4yNywyNS42MmE4NC42NCw4NC42NCwwLDAsMS04LjA5LDguNjVxLTY3LjkyLDY4LTEzNS45NCwxMzUuODZjLTIuNzcsMi43NS02LjQsNC42My05LjYyLDYuOTJaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTgxMC4zOSwxMTM4LjQ0Yy00Mi44NiwwLTgyLjcxLDAtMTIyLjU2LDAtNS4xNCwwLTEwLjMxLjE1LTE1LjQxLS4zN2EyMy4xOSwyMy4xOSwwLDAsMS0yMS0yMS45MWMtLjgtMTIuNTYsNi4zNy0yMi45MSwxOC4yLTI1LjQ4YTY2LjczLDY2LjczLDAsMCwxLDE0LjE0LTEuMTNxODktLjExLDE3OCwwYzI0Ljc0LDAsMzMsOC4xMiwzMy4wNywzMi40OXEuMTEsODkuNT'+
			'gsMCwxNzkuMTdhNzEuNTUsNzEuNTUsMCwwLDEtLjMzLDguMjljLTEuNzQsMTUuMTUtMTEuNjUsMjQtMjYsMjMuMzItMTMuNDEtLjY0LTIyLjUyLTEwLjM0LTIyLjYxLTI1LjI5LS4yNS0zOS45NC0uMTEtNzkuODktLjEyLTExOS44NCwwLTMuNzUsMC03LjUsMC0xNC01LjExLDQuODMtOC4yMiw3LjYzLTExLjE3LDEwLjU4LTQ1Ljg4LDQ1Ljg1LTkxLjU2LDkxLjktMTM3LjgyLDEzNy4zNi01LjQ0LDUuMzUtMTQuMTEsMTAuNjMtMjEsMTAuMzMtNy4zMi0uMzEtMTcuNTUtNS43My0yMC42NC0xMS44Ny0zLjM3LTYuNzEtLjgxLTE2Ljk1LjgxLTI1LjM0LjctMy42Miw1LjQxLTYuNTYsOC40OC05LjYz'+
			'cTY3LjkyLTY4LDEzNS44OC0xMzUuOTRDODAzLDExNDYuNDIsODA1LjU4LDExNDMuNTMsODEwLjM5LDExMzguNDRaIiBjbGFzcz0iY2xzLTEiLz4KICA8L2c+CiA8L2c+Cjwvc3ZnPgo=';
		me._svg_2__img.setAttribute('src',hs);
		els.setAttribute('style','position: absolute;top: 0px;left: 0px;width: 100%;height: 100%;-webkit-user-drag:none;pointer-events:none;;');
		els['ondragstart']=function() { return false; };
		el.appendChild(els);
		el.ggSubElement = els;
		el.ggId="Svg 2";
		el.ggDx=40;
		el.ggDy=-40.44;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=false;
		el.className="ggskin ggskin_svg ";
		el.ggType='svg';
		hs ='';
		hs+='height : calc(2.8rem  +  1vw);';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : hidden;';
		hs+='width : calc(2.8rem  +  1vw);';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._svg_2.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return player.getCurrentNode();
		}
		me._svg_2.onclick=function (e) {
			player.exitFullscreen();
		}
		me._svg_2.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		me._container_1.appendChild(me._svg_2);
		el=me._svg_3=document.createElement('div');
		els=me._svg_3__img=document.createElement('img');
		els.className='ggskin ggskin_svg';
		hs='data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTk4NC4yNSAxOTg0LjI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGRlZnM+CiAgPHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+CiA8L2RlZnM+CiA8ZyBkYXRhLW5hbWU9IkxheWVyIDIiIGlkPSJMYXllcl8yIj4KICA8ZyBkYXRhLW5hbWU9IkNhcGEgMiIgaWQ9IkNhcGFfMiI+CiAgIDxjaXJjbGUgY3k9Ijk5Mi4xMyIgcj0iOTkyLjEzIiBjeD0iOTkyLjEzIi8+CiAgIDxwYXRoIGQ9Ik0xNDc4LjYyLDk5Mi4xMXEwLDE3OC42MiwwLDM1Ny4yNGMwLDc3LjQ5LTUxLjg2LDEyOS4zNy0xMjkuMzEsMTI5LjM3cS0zNTcuMTgsMC'+
			'03MTQuMzcsMGMtNzcuNDMsMC0xMjkuMzMtNTEuOS0xMjkuMzMtMTI5LjM0cTAtMzU5LjYxLDAtNzE5LjIzYzAtNTguOTQsMzYuNzMtMTA2LjY3LDkyLjkyLTEyMC42OGExMzIuMzUsMTMyLjM1LDAsMCwxLDMxLjYtMy43N3EzNjEuOTQtLjMxLDcyMy44Ni0uMTFjNzEuMDYsMCwxMjQuNDUsNTMuNDUsMTI0LjU1LDEyNC41MlExNDc4Ljg2LDgxMS4xMiwxNDc4LjYyLDk5Mi4xMVpNOTkwLjg3LDE0MjkuMjVxMTgxLDAsMzYxLjk1LDBjNDYuMTMsMCw3Ni4yOC0zMC4zLDc2LjI5LTc2LjUzcS4wOS0zNjAuODEsMC03MjEuNjNjMC00NS40OS0zMC4yOS03Ni03NS42LTc2cS0zNjEuMzUtLjEyLTcyMi43'+
			'LDBjLTQ1LjM5LDAtNzUuNjgsMzAuNDUtNzUuNjksNzUuOXEtLjA5LDM2MS40MSwwLDcyMi44M2MwLDUuODkuMTMsMTEuOTQsMS40LDE3LjY1LDcuODcsMzUuMjMsMzUuODYsNTcuNzEsNzIuMzksNTcuNzVRODA5LjkxLDE0MjkuNCw5OTAuODcsMTQyOS4yNVoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNMTI0NS41OSw3MDAuNDJxLTMxLjg1LDAtNjMuNjgsMGMtMjMuMzMsMC00Ni42Ny4yMy03MC0uMzUtMTMtLjMyLTIyLTEwLjE5LTIyLjQ3LTIyLjg4LS40NC0xMy4wNyw3LjM2LTIyLjgzLDIwLjI4LTI1YTcyLjY5LDcyLjY5LDAsMCwxLDExLjgxLS43MnE4OS0uMDYsMTc3Ljk0LDBjMj'+
			'UuMzMsMCwzMy4zNCw4LDMzLjM3LDMzLjM3cS4wOCw4OC4zOSwwLDE3Ni43OGE3Ny42LDc3LjYsMCwwLDEtLjY4LDExLjgyYy0yLjExLDEzLjctMTEuOSwyMS44My0yNS4zMiwyMS4zMS0xMy4wNy0uNS0yMi42OS05LjktMjIuODEtMjMuODEtLjM0LTM5Ljk0LS4xOC03OS44OS0uMjEtMTE5LjgzLDAtNC4yMSwwLTguNDEsMC0xMi42MmwtNS4xMS00Yy0yLDMuODUtMy4xMiw4LjUyLTYsMTEuNDVRMTIwNC4xNyw4MTUuMDYsMTEzNSw4ODMuNDljLTUuNDUsNS4zNi0xMy42Myw5LjMtMjEuMTYsMTAuODUtOS44MSwyLTE3LjQzLTQtMjEuODktMTIuODRzLTMuNzQtMTcuNjMsMi4yNi0yNS42MmE4Ni43'+
			'Nyw4Ni43NywwLDAsMSw4LjA5LTguNjVxNjcuOTMtNjgsMTM2LTEzNS44NWMyLjc2LTIuNzYsNi4zOS00LjY0LDkuNjItNi45M1oiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNNzM1Ljc1LDEyODMuODVjNDIuODUsMCw4Mi43MSwwLDEyMi41NiwwLDUuMTQsMCwxMC4zMS0uMTUsMTUuNDEuMzdhMjMuMTksMjMuMTksMCwwLDEsMjEsMjEuOTFjLjc5LDEyLjU2LTYuMzcsMjIuOTEtMTguMiwyNS40OGE2Ni43Myw2Ni43MywwLDAsMS0xNC4xNCwxLjEzcS04OSwuMTEtMTc4LDBjLTI0LjczLDAtMzMtOC4xMi0zMy4wNi0zMi40OXEtLjEyLTg5LjU4LDAtMTc5LjE3YTczLjg0LDczLjg0LDAsMC'+
			'wxLC4zMi04LjI5YzEuNzQtMTUuMTUsMTEuNjUtMjQsMjYtMjMuMzIsMTMuNDEuNjQsMjIuNTIsMTAuMzQsMjIuNjEsMjUuMjkuMjQsMzkuOTQuMTEsNzkuODkuMTIsMTE5Ljg0djE0YzUuMTEtNC44Myw4LjIyLTcuNjMsMTEuMTctMTAuNTgsNDUuODctNDUuODUsOTEuNTYtOTEuOSwxMzcuODEtMTM3LjM2LDUuNDQtNS4zNSwxNC4xMi0xMC42MywyMS4wNi0xMC4zMyw3LjMxLjMxLDE3LjU1LDUuNzMsMjAuNjQsMTEuODcsMy4zNiw2LjcxLjgxLDE3LS44MSwyNS4zNC0uNywzLjYyLTUuNDEsNi41Ni04LjQ4LDkuNjNxLTY3LjkyLDY4LTEzNS44OCwxMzUuOTRDNzQzLjE2LDEyNzUuODcsNzQwLjU2'+
			'LDEyNzguNzYsNzM1Ljc1LDEyODMuODVaIiBjbGFzcz0iY2xzLTEiLz4KICA8L2c+CiA8L2c+Cjwvc3ZnPgo=';
		me._svg_3__img.setAttribute('src',hs);
		els.setAttribute('style','position: absolute;top: 0px;left: 0px;width: 100%;height: 100%;-webkit-user-drag:none;pointer-events:none;;');
		els['ondragstart']=function() { return false; };
		el.appendChild(els);
		el.ggSubElement = els;
		el.ggId="Svg 3";
		el.ggDx=40;
		el.ggDy=-40.44;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_svg ";
		el.ggType='svg';
		hs ='';
		hs+='height : calc(2.8rem  +  1vw);';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : inherit;';
		hs+='width : calc(2.8rem  +  1vw);';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._svg_3.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return player.getCurrentNode();
		}
		me._svg_3.onclick=function (e) {
			player.enterFullscreen();
		}
		me._svg_3.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		me._container_1.appendChild(me._svg_3);
		el=me._svg_4=document.createElement('div');
		els=me._svg_4__img=document.createElement('img');
		els.className='ggskin ggskin_svg';
		hs='data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTk4NC4yNSAxOTg0LjI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGRlZnM+CiAgPHN0eWxlPi5jbHMtMSwuY2xzLTJ7ZmlsbDojZmZmO3N0cm9rZTojZmZmO3N0cm9rZS1taXRlcmxpbWl0OjEwO30uY2xzLTF7c3Ryb2tlLXdpZHRoOjE1cHg7fS5jbHMtMntzdHJva2Utd2lkdGg6MnB4O308L3N0eWxlPgogPC9kZWZzPgogPGcgZGF0YS1uYW1lPSJMYXllciAyIiBpZD0iTGF5ZXJfMiI+CiAgPGcgZGF0YS1uYW1lPSJDYXBhIDIiIGlkPSJDYXBhXzIiPgogICA8Y2lyY2xlIGN5PSI5OTIuMTMiIHI9Ijk5Mi4xMyIgY3g9Ijk5Mi4xMyIvPg'+
			'ogICA8cGF0aCBkPSJNMTE3Mi4zMywxMzg3LjIyYTExLjY4LDExLjY4LDAsMCwwLTExLjEzLDEyLjE1bC4zNCw4LjE3YTExLjY5LDExLjY5LDAsMCwwLDEyLjIsMTEuMTdxMTEuODgtLjU0LDIzLjU2LTEuMTVhMTEuNjcsMTEuNjcsMCwwLDAsMTEuMDYtMTIuM2wtLjQ5LTguODRhMTEsMTEsMCwwLDAtMTEuNTYtMTAuNFoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNMTU1Ny4xMSwxMjE3LjY0cS0xMS4yMy0yLjc5LTIzLjM3LTUuNDRhMTEuNjksMTEuNjksMCwwLDAtMTQsOWwtMS42NSw4YTExLjY4LDExLjY4LDAsMCwwLDguOTMsMTMuNzdxMTEuNjMsMi41NCwyMi4zMiw1LjE5YTExLjY4'+
			'LDExLjY4LDAsMCwwLDE0LjA5LTguMzRsMi4wOS03LjlBMTEuNjYsMTEuNjYsMCwwLDAsMTU1Ny4xMSwxMjE3LjY0WiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xNjM3Ljc2LDEzMDkuNjJhMTE3LjE4LDExNy4xOCwwLDAsMS0xMS4zMiw2LjQ2LDExLjcsMTEuNywwLDAsMC01LjUsMTUuMDlsMy4yNiw3LjUxYTExLjY1LDExLjY1LDAsMCwwLDE1Ljg4LDUuODIsMTUwLjIyLDE1MC4yMiwwLDAsMCwxNS04LjUyLDEwMS44MiwxMDEuODIsMCwwLDAsOC43NS02LjQxLDExLjY0LDExLjY0LDAsMCwwLS4zMi0xOC4xMmwtNi42MS01LjE4YTExLjYxLDExLjYxLDAsMCwwLTE0LjMtLjA3QzE2ND'+
			'EuMTUsMTMwNy4zLDE2MzkuNTUsMTMwOC40NSwxNjM3Ljc2LDEzMDkuNjJaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTE2NDkuNDYsMTI1MWExOTUuNDQsMTk1LjQ0LDAsMCwwLTIzLjQzLTExLjUsMTEuNjcsMTEuNjcsMCwwLDAtMTUuNDcsNi42N2wtMi44Niw3LjY1YTExLjY5LDExLjY5LDAsMCwwLDYuNDUsMTQuODYsMTcxLjQ5LDE3MS40OSwwLDAsMSwxOC43Miw5LjEzLDExLjY0LDExLjY0LDAsMCwwLDE1LjExLTMuMThsNC45MS02LjU5QTExLjY3LDExLjY3LDAsMCwwLDE2NDkuNDYsMTI1MVoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNMTExNC43MSwxNDA5LjIyYTEx'+
			'LjY4LDExLjY4LDAsMCwxLTExLjM3LDEycS0xMS42Ny4zLTIzLjQ2LjU1YTExLjc5LDExLjc5LDAsMCwxLTEyLTExLjU5bC0uMTQtOGExMS42NywxMS42NywwLDAsMSwxMS40NS0xMS44N2gyMy4zNmExMi4xOCwxMi4xOCwwLDAsMSwxMi4xOCwxMi4xOFoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNMTQ0MC40NSwxMzc0LjczbDEuMTksOC4wOWExMS42OCwxMS42OCwwLDAsMCwxMy4zMiw5Ljg0cTEyLTEuODYsMjMuNDYtMy44MWExMS42OCwxMS42OCwwLDAsMCw5LjU1LTEzLjU3bC0xLjQ0LThhMTEuNjYsMTEuNjYsMCwwLDAtMTMuNDItOS40NnEtMTEuMTYsMS45LTIyLjg4LDMuNzFBMT'+
			'EuNjgsMTEuNjgsMCwwLDAsMTQ0MC40NSwxMzc0LjczWiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xMzQ3LjcyLDEzODYuMjJsLjgzLDguMTNhMTEuNjksMTEuNjksMCwwLDAsMTIuODcsMTAuNDJxMTEuOTQtMS4yOSwyMy41My0yLjY1YTExLjY3LDExLjY3LDAsMCwwLDEwLjIxLTEzbC0xLTguMTFhMTEuNjYsMTEuNjYsMCwwLDAtMTIuOTQtMTAuMTdxLTExLjM4LDEuMzUtMjMuMTMsMi42MUExMS42NiwxMS42NiwwLDAsMCwxMzQ3LjcyLDEzODYuMjJaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTE1MzIuMjcsMTM1OC4xMWwxLjc3LDhhMTEuNjgsMTEuNjgsMCwwLDAsMTQu'+
			'MDksOC44MnExMi4xOS0yLjg3LDIzLjM4LTUuODhhMTEuNjgsMTEuNjgsMCwwLDAsOC4xNS0xNC41M2wtMi4yOC03Ljg1YTExLjY3LDExLjY3LDAsMCwwLTE0LjIyLThxLTEwLjU2LDIuODUtMjIuMTgsNS41OUExMS42NywxMS42NywwLDAsMCwxNTMyLjI3LDEzNTguMTFaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTEyNjUuMzUsMTM4MS43NGExMS42NywxMS42NywwLDAsMC0xMC43OCwxMi40NWwuNTYsOC4xNWExMS42OSwxMS42OSwwLDAsMCwxMi41MSwxMC44NHExMS44OS0uODcsMjMuNTUtMS44MmExMS42NywxMS42NywwLDAsMCwxMC42OC0xMi42M2wtLjc0LTguNzVhMTEuMSwxMS'+
			'4xLDAsMCwwLTExLjk0LTEwLjEyWiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xMDAzLjM3LDE0MDIuNzZ2OC4xN2ExMS42NywxMS42NywwLDAsMCwxMS42OSwxMS42N2guMzVhMTEuNjYsMTEuNjYsMCwwLDAsMTEuNjItMTEuNzRsMC04LjE3YTExLjY5LDExLjY5LDAsMCwwLTExLjczLTExLjYxSDEwMTVBMTEuNjksMTEuNjksMCwwLDAsMTAwMy4zNywxNDAyLjc2WiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xMjM4LjYxLDEyNzguMzRjNi4yLjIzLDEyLjM2LjMxLDE4LjQ4LjMxLDE0LjE4LDAsMjguMDktLjQzLDQxLjUxLS40OXExNy41NC0uMDksMzUuMDctLjA5YzIzLjM5'+
			'LDAsNDYuODIuMDksNzAuMjkuMDlhMTE5LjEyLDExOS4xMiwwLDAsMCwxMTkuMTEtMTE5LjExdi0xMS4zNGE1OS4xLDU5LjEsMCwwLDAsNjYuNTgtMTAsNTQuNjIsNTQuNjIsMCwwLDAsMTcuMTYtMzkuNjFWOTE2LjFhNTQuNjgsNTQuNjgsMCwwLDAtMTcuMTUtMzkuNjIsNTguNTksNTguNTksMCwwLDAtNDAuNDgtMTYsNTkuMTksNTkuMTksMCwwLDAtMjcuMzQsNi42NUExMTkuMDgsMTE5LjA4LDAsMCwwLDE0MDQsNzY0LjkySDU5MGExMTkuMDYsMTE5LjA2LDAsMCwwLTExOSwxMTYuMyw1OS4xOCw1OS4xOCwwLDAsMC02Ni42Niw5LjkyLDU0LjY3LDU0LjY3LDAsMCwwLTE3LjE1LDM5LjYxdjE4Mi'+
			'4wNmE1NC42Nyw1NC42NywwLDAsMCwxNy4xNSwzOS42MSw1OS4xNiw1OS4xNiwwLDAsMCw2Ni42OCw5LjkyLDExOC4zMSwxMTguMzEsMCwwLDAsMTAuMzcsNDUuNDhjLTI5LjUzLDUuODQtNTUuNzcsMTIuMjEtNzguMTcsMTkuMDgtMjYuNjIsOC4xOS00Ny44OSwxNi45NS02My43MiwyNy4xNS03LjkxLDUuMTUtMTQuNTYsMTAuNjgtMTkuNjgsMTcuMzZhNDQuMzIsNDQuMzIsMCwwLDAtNi4yMiwxMSwzNS44OCwzNS44OCwwLDAsMC0yLjM5LDEyLjc3LDM3LDM3LDAsMCwwLDQuMzIsMTcuMDcsNTIuMzcsNTIuMzcsMCwwLDAsOS43OCwxMi45MWM3LjM1LDcuMiwxNi42NiwxMy4yNSwyNy45MSwxOSwx'+
			'OS42Nyw5Ljk1LDQ1LjQ1LDE4Ljc3LDc2LjkzLDI2Ljg5LDQ3LjE5LDEyLjE1LDEwNy4xMywyMi41NiwxNzYuNzUsMzAuODMsNTYuNjQsNi43MiwxMTkuNjYsMTIsMTg3LjI1LDE1LjU3bC0uMzksODBhMTUuNzUsMTUuNzUsMCwwLDAsMjQuMzcsMTMuMjdsMTQ3LTk1LjkzYTE1Ljc2LDE1Ljc2LDAsMCwwLC4xMy0yNi4zMWwtMTQ2LTk3LjM3YTE1Ljc2LDE1Ljc2LDAsMCwwLTI0LjUsMTNsLS40LDgxLjdjLTEyNi43Mi02LjczLTIzNi45NC0xOS42LTMxNy4zOC0zNi4zNi0yMi42MS00LjctNDIuODYtOS43MS02MC4zOC0xNC45My0yNi4yOC03Ljc4LTQ2LjUxLTE2LjIxLTU4Ljk1LTI0LjA5LTYuMj'+
			'ItMy45MS0xMC40MS03LjY1LTEyLjU0LTEwLjQyYTEzLjM0LDEzLjM0LDAsMCwxLTItMy4yNSw0LjE4LDQuMTgsMCwwLDEtLjM1LTEuNjMsNC4xLDQuMSwwLDAsMSwuMzMtMS41N2MuNDktMS4zNSwyLjA2LTMuOTEsNS41My03LDYtNS41MywxNy40Mi0xMi4yOSwzMy4yMi0xOC43NCwyMy43Mi05Ljc3LDU3LjIxLTE5LjIxLDk4LjIyLTI3LjYsNi4zLTEuMywxMi44NS0yLjU2LDE5LjUtMy44LDIsMi4zNiw0LjEsNC42NSw2LjI5LDYuODRBMTE4LjgxLDExOC44MSwwLDAsMCw1OTAsMTI3OC4xNkg3MDkuNGM0NC4xMiwwLDg2LjA5LTYuOTEsMTIyLjc1LTI1LjE4YTE4NS41OSwxODUuNTksMCwwLDAs'+
			'NTAuMDktMzYuMzUsMjAzLjY4LDIwMy42OCwwLDAsMCwzOC01NS4yOGwuMDctLjE2LDEuMzgtMywuNTItMS4yNGM1LjMzLTE0LjY2LDE0LjE5LTI2LjQsMjUuNTgtMzQuNThzMjUuNDMtMTIuOSw0Mi0xMi45MmE2OS44LDY5LjgsMCwwLDEsMzkuMzksMTEuNzZjMTEuMjMsNy41MywyMC41NCwxOC40NSwyNywzMi4xMWEyNTUuNzYsMjU1Ljc2LDAsMCwwLDM3Ljg1LDU4LjM2YzE1LjQxLDE3Ljc1LDMzLjU3LDMzLjMsNTQuMzEsNDQuODdhMTYxLjM5LDE2MS4zOSwwLDAsMCw0NC44NSwxNi41NiwyNTkuMzUsMjU5LjM1LDAsMCwwLDQ1LjQzLDUuMjJNNDcwLjkxLDExMTIuODFhMjMsMjMsMCwwLDEtNy'+
			'4zNywxNi43OSwyNy41OCwyNy41OCwwLDAsMS0zNy40NywwLDIzLDIzLDAsMCwxLTcuMzgtMTYuNzlWOTMwLjc1QTIzLjA2LDIzLjA2LDAsMCwxLDQyNi4wNiw5MTRhMjcuNjIsMjcuNjIsMCwwLDEsMzcuNDgsMCwyMywyMywwLDAsMSw3LjM3LDE2Ljc5Wk04MjYuMDYsMTMzMy42bDEwMS43OSw2Ny44N0w4MjUuNCwxNDY4LjM1Wm02NjUuNDktMTc0LjU1YTg3LjU5LDg3LjU5LDAsMCwxLTg3LjU5LDg3LjU5Yy0yMy40LDAtNDYuODItLjA4LTcwLjI5LS4wOHEtMTcuNjEsMC0zNS4yMy4wOGMtMTMuOTQuMDctMjcuOC40OS00MS4zNS40OS01Ljg1LDAtMTEuNjMtLjA4LTE3LjM0LS4yOGEyMjkuODks'+
			'MjI5Ljg5LDAsMCwxLTM5LjkyLTQuNTMsMTI5Ljc1LDEyOS43NSwwLDAsMS0zNi4xNy0xMy4zYy0xNy4wNS05LjUtMzIuNTEtMjIuNjItNDUuODUtMzhhMjI0LjksMjI0LjksMCwwLDEtMzMuMTUtNTEuMTYsMTEwLDExMCwwLDAsMC0zOC00NC44MywxMDEuNDUsMTAxLjQ1LDAsMCwwLTU2Ljk0LTE3LjFjLTIyLjY5LDAtNDMuNTMsNi43NS02MC4zMiwxOC44Mi0xNi41MiwxMS44My0yOS4wNSwyOC42Ni0zNi40Miw0OC4zOWwtMS4yMywyLjY1Yy05LDE4LjgyLTE5Ljc3LDM0LjE4LTMyLjEsNDYuNzktMTguNDksMTguODktNDAuNTMsMzEuNzUtNjUuODMsNDAuMDlzLTUzLjgzLDEyLTg0LjQ3LDEySD'+
			'U5MGE4Ny41OSw4Ny41OSwwLDAsMS04Ny42LTg3LjU5Vjg4NEE4Ny41OSw4Ny41OSwwLDAsMSw1OTAsNzk2LjQ0SDE0MDRBODcuNTksODcuNTksMCwwLDEsMTQ5MS41NSw4ODR2Mjc1Wm04My43NC02MC45YTIzLDIzLDAsMCwxLTcuMzcsMTYuNzksMjcuNjIsMjcuNjIsMCwwLDEtMzcuNDgsMCwyMywyMywwLDAsMS03LjM3LTE2Ljc5VjkxNi4xYTIzLDIzLDAsMCwxLDcuMzctMTYuOCwyNy42MiwyNy42MiwwLDAsMSwzNy40OCwwLDIzLjA5LDIzLjA5LDAsMCwxLDcuMzcsMTYuOFoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNNjc4LjcsNDY2LjYybC03MC4yNCwxODdINTcyLjk0bC03MC41'+
			'MS0xODdoMzIuODNMNTkwLjcsNjIyLjE3bDU1LjctMTU1LjU1WiIgY2xhc3M9ImNscy0yIi8+CiAgIDxwYXRoIGQ9Ik04MDEuNCw2NTMuNjVsLTQzLTc0LjgxSDczNC45M3Y3NC44MUg3MDQuMjZ2LTE4N2g2NC41OHEyMS41MiwwLDM2LjQ3LDcuNTR0MjIuMzMsMjAuMThBNTUsNTUsMCwwLDEsODM1LDUyMi42YTU2LDU2LDAsMCwxLTEwLjYzLDMzLjIzcS0xMC42MywxNC45NC0zMi42OSwyMC4zMkw4MzgsNjUzLjY1Wm0tNjYuNDctOTkuM2gzMy45MXExNy4yMiwwLDI2LTguNjF0OC43NS0yMy4xNHEwLTE0LjU0LTguNjEtMjIuNzR0LTI2LjExLTguMjFINzM0LjkzWiIgY2xhc3M9ImNscy0yIi8+Ci'+
			'AgIDxwYXRoIGQ9Ik0xMDQ1Ljg3LDU3My40MUE0MC44Myw0MC44MywwLDAsMCwxMDI0LDU1Ny45MmwtLjg0LS4yNnYtMi43NGwuODEtLjI3YzcuMi0yLjQsMTMuNS03LjE2LDE4LjczLTE0LjE1czcuODUtMTUuNjcsNy44NS0yNS44MmE0NS4yMiw0NS4yMiwwLDAsMC02LjQyLTIzLjkxYy00LjI2LTctMTAuNjctMTIuNjEtMTkuMDYtMTYuNzJzLTE4LjczLTYuMjQtMzAuNjEtNi4yNGMtMTcuMzksMC0zMS41OSw0LjQ3LTQyLjIsMTMuM2E0NC45MSw0NC45MSwwLDAsMC0xMiwxNS41NSw1Ny45Myw1Ny45MywwLDAsMC01LjA3LDIwLjgySDk2N2EyNi42NywyNi42NywwLDAsMSw3LjU3LTE1LjcxYzQu'+
			'NDQtNC40NSwxMC44LTYuNywxOC44OS02LjcsOC4yNiwwLDE0LjY5LDIuMTEsMTkuMTIsNi4yOXM2LjczLDEwLjEyLDYuNzMsMTcuNTZjMCwxNi40OS0xMi4yOSwyNC44Ni0zNi41NSwyNC44NmgtNlY1NzBoNmMxMy40NSwwLDIzLjU3LDIuMjQsMzAuMDYsNi42OHMxMCwxMi4wOCwxMCwyMi40MWMwLDcuNzUtMi40MiwxNC4xOC03LjE5LDE5LjEzcy0xMS42NSw3LjQ2LTIwLjQxLDcuNDZjLTkuNCwwLTE2LjkzLTIuNTktMjIuMzYtNy42OC01LjE5LTQuODYtOC4xLTExLjMzLTguNjUtMTkuMjJoLTMxLjVjLjg4LDE3LjM4LDcsMzAuNzMsMTguMTgsMzkuNzIsMTEuNTEsOS4yNCwyNi42OCwxMy45My'+
			'w0NS4wOCwxMy45MywxMi4yLDAsMjIuNzktMi4xOCwzMS40Ny02LjQ4YTQ1LjcyLDQ1LjcyLDAsMCwwLDE5LjY4LTE3LjgzLDUwLjkyLDUwLjkyLDAsMCwwLDYuNjgtMjZDMTA1My43NCw1OTAuNDUsMTA1MS4wOSw1ODAuOCwxMDQ1Ljg3LDU3My40MVoiIGNsYXNzPSJjbHMtMiIvPgogICA8cGF0aCBkPSJNMTIwNiw1NjAuNjlhNDcuNCw0Ny40LDAsMCwwLTE5LTE5LjgxYy04LjA5LTQuNTMtMTcuNTMtNi44My0yOC4wNy02LjgzYTU1LjA1LDU1LjA1LDAsMCwwLTI0LjM3LDUuNDgsMzkuNSwzOS41LDAsMCwwLTE2LjkzLDE1LjEybC0yLjI1LDMuNzQsMC00LjM3Yy4xNy0yMC44NiwzLTM2LjE4LDgu'+
			'NTEtNDUuNTQsNS42LTkuNTYsMTQuNDQtMTQuNDEsMjYuMzEtMTQuNDEsNy44OCwwLDE0LDEuODYsMTguMzMsNS41MmEyMy45MywyMy45MywwLDAsMSw1LjIzLDYuNDgsMzYuODgsMzYuODgsMCwwLDEsMy41Miw4LjkyaDMwLjFhNTUuMiw1NS4yLDAsMCwwLTE2LjE4LTMzLjMyYy05LjM2LTkuMi0yMi43NC0xMy44Ni0zOS43Ny0xMy44Ni0yMiwwLTM4LjM4LDcuNjYtNDguNTcsMjIuNzYtMTAuMjcsMTUuMjYtMTUuNDcsMzguMTktMTUuNDcsNjguMTksMCwxOS45LDIsMzYuODQsNS44LDUwLjM2czEwLjYzLDI0LDIwLjI1LDMxLjM4LDIzLjA3LDExLjIxLDQwLDExLjIxYzEyLjM0LDAsMjMuMTItMi'+
			'41NSwzMi03LjU2YTUwLDUwLDAsMCwwLDIwLjMyLTIxYzQuNjItOSw3LTE5LjQyLDctMzFDMTIxMi44Nyw1ODAsMTIxMC41OCw1NjkuMzcsMTIwNiw1NjAuNjlaTTExNzQsNjE1Ljg4Yy01LjQ0LDUuNjktMTIuODksOC41OC0yMi4xNiw4LjU4LTEwLjQxLDAtMTguNi0zLTI0LjM3LTguODJzLTguNjktMTMuOTItOC42OS0yNCwzLjE1LTE4LDkuMzgtMjMuMzJoMGM2LjE3LTUuMzIsMTMuODktOCwyMy04LDEwLjA5LDAsMTcuODksMywyMy4xNyw4Ljg3czcuOSwxMy44Myw3LjksMjMuN0MxMTgyLjE0LDYwMi40NSwxMTc5LjM4LDYxMC4yLDExNzQsNjE1Ljg4WiIgY2xhc3M9ImNscy0yIi8+CiAgIDxw'+
			'YXRoIGQ9Ik0xMzU5LjM4LDQ5Mi40MmMtMTAuMTEtMTUuODQtMjcuMTUtMjMuODUtNTAuNjctMjMuODVzLTQwLjU4LDgtNTAuNjgsMjMuODVjLTUuMSw4LTguOTQsMTcuNjItMTEuNTEsMjguNzlhMTcwLjQ5LDE3MC40OSwwLDAsMC0zLjg2LDM4YzAsMjguNTQsNS4xNyw1MS4yLDE1LjM4LDY3LjM1czI3LjE0LDI0LjEsNTAuNjcsMjQuMSw0MC41Ni04LjEsNTAuNjctMjQuMWMxMC4yLTE2LjE2LDE1LjM4LTM4LjgyLDE1LjM4LTY3LjM1QzEzNzQuNzYsNTMwLjkxLDEzNjkuNTgsNTA4LjQzLDEzNTkuMzgsNDkyLjQyWm0tMTguODcsOTguODFjLTEuNTMsOC43My00LjgxLDE1Ljg5LTkuNzYsMjEuMj'+
			'ZzLTEyLjQ1LDguMjQtMjIsOC4yNC0xNy0yLjc4LTIyLTguMjQtOC4yNC0xMi41My05Ljc2LTIxLjI2YTE5MSwxOTEsMCwwLDEtMi4yNi0zMmMwLTEyLjMuOC0yMi44MSwyLjM5LTMxLjIyczQuODgtMTUuNjYsOS43NS0yMS4xMSwxMi4zMS04LjM4LDIxLjkzLTguMzgsMTcsMi44MSwyMS45Myw4LjM4LDguMTMsMTIuNTQsOS43NSwyMS4xMWExMjkuNjIsMTI5LjYyLDAsMCwxLDEuNzgsMTQuMTZjLjQsNS4yMi42LDEwLjkyLjYsMTcuMDZBMTkwLjg3LDE5MC44NywwLDAsMSwxMzQwLjUxLDU5MS4yM1oiIGNsYXNzPSJjbHMtMiIvPgogICA8cGF0aCBkPSJNMTQ3OC41LDQ4OS44Yy04LjY5LTcuODEt'+
			'MjAuMTctMTEuNzgtMzQuMDctMTEuNzgtMTQuMDgsMC0yNS42OCwzLjkyLTM0LjQ2LDExLjY2YTM3LjA5LDM3LjA5LDAsMCwwLTkuODUsMTMuNjcsNDUuODUsNDUuODUsMCwwLDAtMy4zMSwxNy44MWMwLDEzLjIsNC40LDIzLjg5LDEzLjA2LDMxLjc0czIwLjE2LDExLjksMzQuMDYsMTEuOWMxNC4wOCwwLDI1LjY2LTQsMzQuNDQtMTEuOXMxMy4xOC0xOC41NCwxMy4xOC0zMS43NEMxNDkxLjU1LDUwOC4xMywxNDg3LjE2LDQ5Ny41NywxNDc4LjUsNDg5LjhabS0xOC42NSw1MC44OGEyMS42NSwyMS42NSwwLDAsMS0xNS45Miw2LjgzLDIxLjA2LDIxLjA2LDAsMCwxLTE1LjkzLTYuODZjLTQuMjYtNC'+
			'41MS02LjQzLTExLTYuNDMtMTkuMjQsMC04LjQxLDIuMi0xNSw2LjU1LTE5LjYyYTIxLjA5LDIxLjA5LDAsMCwxLDE1LjgxLTcsMjEuMzYsMjEuMzYsMCwwLDEsMTYuMDYsNywyMi41NCwyMi41NCwwLDAsMSw0LjkxLDguMzksMzUuNTgsMzUuNTgsMCwwLDEsMS42NCwxMS4yM0MxNDY2LjU0LDUyOS42NywxNDY0LjI5LDUzNi4xNSwxNDU5Ljg1LDU0MC42OFoiIGNsYXNzPSJjbHMtMiIvPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==';
		me._svg_4__img.setAttribute('src',hs);
		els.setAttribute('style','position: absolute;top: 0px;left: 0px;width: 100%;height: 100%;-webkit-user-drag:none;pointer-events:none;;');
		els['ondragstart']=function() { return false; };
		el.appendChild(els);
		el.ggSubElement = els;
		el.ggId="Svg 4";
		el.ggDx=20;
		el.ggDy=-40.44;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_svg ";
		el.ggType='svg';
		hs ='';
		hs+='height : calc(2.8rem  +  1vw);';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : inherit;';
		hs+='width : calc(2.8rem  +  1vw);';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._svg_4.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return player.getCurrentNode();
		}
		me._svg_4.onclick=function (e) {
			player.enterVR();
		}
		me._svg_4.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		me._container_1.appendChild(me._svg_4);
		el=me._svg_5=document.createElement('div');
		els=me._svg_5__img=document.createElement('img');
		els.className='ggskin ggskin_svg';
		hs='data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTk4NC4yNSAxOTg0LjI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGRlZnM+CiAgPHN0eWxlPi5jbHMtMSwuY2xzLTJ7ZmlsbDojZmZmO30uY2xzLTJ7c3Ryb2tlOiMxZDFkMWI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOjVweDt9PC9zdHlsZT4KIDwvZGVmcz4KIDxnIGRhdGEtbmFtZT0iTGF5ZXIgMiIgaWQ9IkxheWVyXzIiPgogIDxnIGRhdGEtbmFtZT0iQ2FwYSAyIiBpZD0iQ2FwYV8yIj4KICAgPGNpcmNsZSBjeT0iOTkyLjEzIiByPSI5OTIuMTMiIGN4PSI5OTIuMTMiLz4KICAgPHBhdGggZD0iTTkzMC40LDUxMm'+
			'MxNS44MywyLjU2LDMxLjczLDQuNzIsNDcuNDcsNy43MiwxNTAsMjguNTgsMjc0LjA2LDE1My4xMSwzMDIuMDksMzAzLjUxcTMyLjc2LDE3NS44LTc2LjQ4LDMxNy43MmMtMSwxLjI1LTEuODQsMi41NS0zLjE2LDQuNCwyLjI5LDIuNDYsNC41LDUsNi44Niw3LjM0LDg1LjkzLDg2LDE1OSwxNTguODcsMjQ0LjczLDI0NSw3Ljg0LDcuODgsMTMuNjUsMTcuNzcsMjAuNDEsMjYuNzJ2MTlhMjEuNjYsMjEuNjYsMCwwLDAtMS45NCwzLjA3Yy0xMiwyOC4yNS00MywzNC40Ni02NC44MSwxMi42OS01My4zNy01My4xOC05My42NS05My41Ny0xNDYuOTEtMTQ2Ljg1cS01Ni01Ni4wOC0xMTIuMTUtMTEyLjMz'+
			'Yy0xMyw5LTI1LjI3LDE4LjM0LTM4LjI4LDI2LjU0LTczLjc5LDQ2LjU3LTE1NC4yOSw2Ni44LTI0MS4yNiw1OUM2OTguNywxMjcwLjQzLDU2Mi4xLDExNTUuODIsNTIzLjg5LDk5MS4zMiw0ODguNzEsODM5LjksNTMxLjU4LDcxMCw2NDcuMjQsNjA1LjY4YzU0Ljg4LTQ5LjQ4LDEyMC42OS03Ny42LDE5My40Ni04OS41NCw5LjYtMS41NywxOS4yNi0yLjc4LDI4LjktNC4xNlptLTM0MiwzODhjLjMsMTcxLjcxLDE0MC42LDMxMS42MiwzMTIsMzExLjEyLDE3Mi0uNTEsMzExLjY0LTE0MC41NSwzMTEuMTItMzEyLS41My0xNzItMTQwLjQ0LTMxMS41NC0zMTItMzExLjEyQzcyNy42Miw1ODguNDEsNT'+
			'g4LjA3LDcyOC4zNCw1ODguMzcsOTAwWiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik04NjEuOTQsODYxLjUxYzAtNTAuMjgsMC05OSwwLTE0Ny43MywwLTE2LjU4LDcuNzUtMjguNDgsMjIuNjYtMzUuMjMsMjQuODItMTEuMjQsNTMuMSw2LjY4LDUzLjI4LDM0LC4zMSw0NS44OS4xLDkxLjc5LjEsMTM3LjY4djExLjMzaDExYzQ1LjksMCw5MS43OSwwLDEzNy42OS4xMSwxNS43NywwLDI3LjE0LDcuNzMsMzMuODUsMjEuNzlzNC43OCwyNy44NC00LjgxLDQwYy03LjY3LDkuNzUtMTguMDksMTQuMjQtMzAuNjYsMTQuMjEtNDUuMjYtLjEzLTkwLjUzLDAtMTM1Ljc5LDBIOTM4djExYzAsNDUu'+
			'NTguMDcsOTEuMTYsMCwxMzYuNzQtLjA1LDE5LjcxLTEzLjksMzUuNzEtMzIuNywzOC4yOGEzOCwzOCwwLDAsMS00Mi0yNy43NmMtMS4yMy00LjQ3LTEuMjgtOS4zNi0xLjI5LTE0LjA2cS0uMTMtNjYuNDgtLjA1LTEzMi45NFY5MzcuNmgtMTFjLTQ1LjU4LDAtOTEuMTYuMDYtMTM2Ljc0LDAtMTkuMzQsMC0zNS40NS0xMy42LTM4LjE0LTMxLjcxLTIuOTEtMTkuNjUsOC40Ny0zNy43NSwyNy41Ni00Myw0Ljc4LTEuMywxMC0xLjMyLDE1LTEuMzNxNjYtLjEzLDEzMiwwWiIgY2xhc3M9ImNscy0yIi8+CiAgPC9nPgogPC9nPgo8L3N2Zz4K';
		me._svg_5__img.setAttribute('src',hs);
		els.setAttribute('style','position: absolute;top: 0px;left: 0px;width: 100%;height: 100%;-webkit-user-drag:none;pointer-events:none;;');
		els['ondragstart']=function() { return false; };
		el.appendChild(els);
		el.ggSubElement = els;
		el.ggId="Svg 5";
		el.ggDx=0;
		el.ggDy=-40.44;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_svg ";
		el.ggType='svg';
		hs ='';
		hs+='height : calc(2.8rem  +  1vw);';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : inherit;';
		hs+='width : calc(2.8rem  +  1vw);';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._svg_5.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return player.getCurrentNode();
		}
		me._svg_5.onclick=function (e) {
			player.changeFovLog(-5,true);
		}
		me._svg_5.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		me._container_1.appendChild(me._svg_5);
		el=me._svg_6=document.createElement('div');
		els=me._svg_6__img=document.createElement('img');
		els.className='ggskin ggskin_svg';
		hs='data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTk4NC4yNSAxOTg0LjI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGRlZnM+CiAgPHN0eWxlPi5jbHMtMSwuY2xzLTJ7ZmlsbDojZmZmO30uY2xzLTJ7c3Ryb2tlOiMxZDFkMWI7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOjVweDt9PC9zdHlsZT4KIDwvZGVmcz4KIDxnIGRhdGEtbmFtZT0iTGF5ZXIgMiIgaWQ9IkxheWVyXzIiPgogIDxnIGRhdGEtbmFtZT0iQ2FwYSAyIiBpZD0iQ2FwYV8yIj4KICAgPGNpcmNsZSBjeT0iOTkyLjEzIiByPSI5OTIuMTMiIGN4PSI5OTIuMTMiLz4KICAgPHBhdGggZD0iTTkzMC40LDUxMm'+
			'MxNS44MywyLjU2LDMxLjczLDQuNzIsNDcuNDcsNy43MiwxNTAsMjguNTgsMjc0LjA2LDE1My4xMSwzMDIuMDksMzAzLjUxcTMyLjc2LDE3NS44LTc2LjQ4LDMxNy43MmMtMSwxLjI1LTEuODQsMi41NS0zLjE2LDQuNCwyLjI5LDIuNDYsNC41LDUsNi44Niw3LjM0LDg1LjkzLDg2LDE1OSwxNTguODcsMjQ0LjczLDI0NSw3Ljg0LDcuODgsMTMuNjUsMTcuNzcsMjAuNDEsMjYuNzJ2MTlhMjEuNjYsMjEuNjYsMCwwLDAtMS45NCwzLjA3Yy0xMiwyOC4yNS00MywzNC40Ni02NC44MSwxMi42OS01My4zNy01My4xOC05My42NS05My41Ny0xNDYuOTEtMTQ2Ljg1cS01Ni01Ni4wOC0xMTIuMTUtMTEyLjMz'+
			'Yy0xMyw5LTI1LjI3LDE4LjM0LTM4LjI4LDI2LjU0LTczLjc5LDQ2LjU3LTE1NC4yOSw2Ni44LTI0MS4yNiw1OUM2OTguNywxMjcwLjQzLDU2Mi4xLDExNTUuODIsNTIzLjg5LDk5MS4zMiw0ODguNzEsODM5LjksNTMxLjU4LDcxMCw2NDcuMjQsNjA1LjY4YzU0Ljg4LTQ5LjQ4LDEyMC42OS03Ny42LDE5My40Ni04OS41NCw5LjYtMS41NywxOS4yNi0yLjc4LDI4LjktNC4xNlptLTM0MiwzODhjLjMsMTcxLjcxLDE0MC42LDMxMS42MiwzMTIsMzExLjEyLDE3Mi0uNTEsMzExLjY0LTE0MC41NSwzMTEuMTItMzEyLS41My0xNzItMTQwLjQ0LTMxMS41NC0zMTItMzExLjEyQzcyNy42Miw1ODguNDEsNT'+
			'g4LjA3LDcyOC4zNCw1ODguMzcsOTAwWiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xMDg1LDkzNy42NWMxMi41NywwLDIzLTQuNDYsMzAuNjYtMTQuMjEsOS41OS0xMi4xOSwxMS41OC0yNS44NSw0LjgxLTQwcy0xOC4wOC0yMS43NC0zMy44NS0yMS43OWwtMzY4LS4wNmMtNSwwLTEwLjI0LDAtMTUsMS4zMy0xOS4wOSw1LjIxLTMwLjQ3LDIzLjMxLTI3LjU2LDQzLDIuNjksMTguMTEsMTguOCwzMS42NywzOC4xNCwzMS43MVoiIGNsYXNzPSJjbHMtMiIvPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==';
		me._svg_6__img.setAttribute('src',hs);
		els.setAttribute('style','position: absolute;top: 0px;left: 0px;width: 100%;height: 100%;-webkit-user-drag:none;pointer-events:none;;');
		els['ondragstart']=function() { return false; };
		el.appendChild(els);
		el.ggSubElement = els;
		el.ggId="Svg 6";
		el.ggDx=-20;
		el.ggDy=-40.44;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_svg ";
		el.ggType='svg';
		hs ='';
		hs+='height : calc(2.8rem  +  1vw);';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : inherit;';
		hs+='width : calc(2.8rem  +  1vw);';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._svg_6.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return player.getCurrentNode();
		}
		me._svg_6.onclick=function (e) {
			player.changeFovLog(5,true);
		}
		me._svg_6.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		me._container_1.appendChild(me._svg_6);
		el=me._svg_7=document.createElement('div');
		els=me._svg_7__img=document.createElement('img');
		els.className='ggskin ggskin_svg';
		hs='data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTk4NC4yNSAxOTg0LjI1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGRlZnM+CiAgPHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+CiA8L2RlZnM+CiA8ZyBkYXRhLW5hbWU9IkxheWVyIDIiIGlkPSJMYXllcl8yIj4KICA8ZyBkYXRhLW5hbWU9IkNhcGEgMiIgaWQ9IkNhcGFfMiI+CiAgIDxjaXJjbGUgY3k9Ijk5Mi4xMyIgcj0iOTkyLjEzIiBjeD0iOTkyLjEzIi8+CiAgIDxwYXRoIGQ9Ik0xMTgzLjgyLDU0OS4yNWwyNy45My0xNC40M2MtMi4yMyw0Ni4zMi00LjI1LDg4LjI5LTYuNDQsMTM0bC0xNDEuNDktNDguMjksNjMuNz'+
			'EtMzguOTVjLTI4LjYyLTU2LjMzLTYyLjQ4LTEwNi40Ny0xMjMuMjQtMTMwLjI0LTQ0LjQ4LTE3LjQxLTg0LjQzLTMuMDctMTE5LjIzLDI2LjU2QzgzMy43Myw1MjEuNiw4MDMuMjUsNTc5LjQyLDc4MC4yLDY0MS4xNGMtNTguMDcsMTU1LjUtNjguNjIsMzE2LjM3LTUxLjI2LDQ4MC4wOSwxMS41MiwxMDguNjcsMzYuMjEsMjEzLjcsOTMuNTgsMzA4YTM0NywzNDcsMCwwLDAsNjYuNjMsNzkuMTljNDguOTQsNDIuOTIsMTA1LjIsNDIsMTU2LjI5LDEuMzUsNTAuMzktNDAsODMuNTUtOTMuNjQsMTAyLjYxLTE1My40LDEzLjY4LTQyLjg5LDQxLjgtNDguNTUsODEuNDQtNTAuMjQtMzAuMjcsOTYtNjcu'+
			'NjIsMTg0LjYyLTE0NiwyNDguMzgtNzkuODUsNjUtMTc1Ljk1LDU4LjE4LTI1MS4zMS0xNi41OC03Mi44My03Mi4yNS0xMTAuNTQtMTYzLjg3LTEzNC4zLTI2MS4wNi01NS4yMy0yMjUuOTEtNTAuMjctNDQ5LjY3LDMyLjUyLTY2OS4wNywyMi41Ni01OS43OCw1NC4xMy0xMTQuNjYsMTAwLTE2MCw4NC04My4wNiwxOTEuNDEtODMuNzQsMjc0LC43OUMxMTMzLjQ1LDQ3OC4xNSwxMTU2LjI0LDUxMy44MSwxMTgzLjgyLDU0OS4yNVoiIGNsYXNzPSJjbHMtMSIvPgogICA8cGF0aCBkPSJNNzc3LjA5LDEyMjkuODJjODIuNDQsMi42OCwxNjAsOSwyMzcuMjYsNi44NSwxMjUuNTUtMy41NywyNDguNC0yNS'+
			'4wOSwzNjAuNjktODUuMTMsMzQuNjMtMTguNTEsNjgtNDIuNTEsOTUuNzEtNzAuMiw1NS01NC44Niw1NC40OC0xMTkuNzMsMi4xNy0xNzcuNi01My45NC01OS42Ny0xMjUuMzYtOTAuNjgtMjAwLTExMy44Mi0xNTMtNDcuMzktMzA5LjI4LTU0LjQzLTQ2Ny4zOC0zMy4zLTcuODYsMS0xNS44NiwxLjA2LTIzLjkyLDEuNTcuNjEtNTAuOTQsNS44MS01OS41NSw1MC45Mi02My44NSwyMDMuODctMTkuNDQsNDAyLjg5LTMuOTEsNTg2Ljg2LDk1LjY0LDM4LjY3LDIwLjkzLDc0LjU2LDUxLjIyLDEwNCw4NC4xLDY0LjUzLDcyLDYyLjU5LDE2Mi42NC40MiwyMzcuMDktNTUuNzYsNjYuNzgtMTMwLjYyLDEw'+
			'NC40Mi0yMTAuNjgsMTMxLjQ4QzExNDkuNDIsMTI5OCw5ODEuMTQsMTMwOSw4MTAuNCwxMjg3LDc3NS4xNywxMjgyLjQ1LDc4OS41NiwxMjQ4LjcsNzc3LjA5LDEyMjkuODJaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTY1MC4yNCw3MzAuMWMtMywzOC4zMy03LjU2LDY1LjU2LTUwLDgxLjQ5LTQ2Ljc2LDE3LjU3LTkxLjg2LDQ1LjczLTEzMC4yMiw3OC4xMy03Mi40NCw2MS4xOC03MS43LDEzOC4zNC0yLjQ1LDIwMy40NiwyNC4yNywyMi44Miw1My40MSw0MC40Niw4My4zMiw2Mi43LDEzLjkzLTIyLjY5LDI1Ljk0LTQyLjIyLDQxLjM5LTY3LjM4bDQ4LjI4LDE0MC43MS0xMzIuMiw3Lj'+
			'g2YzUuMTgtMTIuNTcsOS4yNC0yMi40NCwxMS45My0yOS0zNS42OC0yOC40OC03Mi44NS01Mi43MS0xMDMuMzQtODMuNTUtODAuODMtODEuOC03OS4yOS0xODQuNzkuNjgtMjY2Ljg5QzQ4MS40OCw3OTIuMTUsNTYyLjA1LDc1Ny40Niw2NTAuMjQsNzMwLjFaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTgzMS4zMSw5MzQuMjFxMTYtMTEuNTIsMzguNTktMTEuNTIsMjAuMjksMCwzMS4wOCw5LjA5dDEwLjc4LDIzLjg5YTUzLjQsNTMuNCwwLDAsMS0uNjMsNy44M0E0MS44Myw0MS44MywwLDAsMSw5MDAuNDUsOTg2cS04LjU3LDkuMTktMTguNzEsMTIuMzd2Ljg0YTI5LjA4LDI5LjA4LDAs'+
			'MCwxLDE0LjgsMTAuNDdxNS4yOCw3LjMsNS4yOCwxOC41YTUxLjM0LDUxLjM0LDAsMCwxLS44NCw5LjUyLDUyLjE0LDUyLjE0LDAsMCwxLTkuOTQsMjIuNjIsNTEuMzcsNTEuMzcsMCwwLDEtMTkuODgsMTUuNTRxLTEyLjI1LDUuNjEtMjguMTEsNS42LTIxLjU3LDAtMzQuMjYtOS44M3QtMTIuNjgtMjkuMjhhNjAuMyw2MC4zLDAsMCwxLC42My04LjQ2SDgyNS41YTIzLjcyLDIzLjcyLDAsMCwwLS4yMiwzLjgxcTAsOC42Nyw1LjUsMTMuODV0MTUuODYsNS4xOHExMi4yNSwwLDE5LjU2LTcuODJhMjcuMiwyNy4yLDAsMCwwLDcuMjktMTkuMjVxMC05LjcyLTcuMTktMTR0LTIyLjItNC4yM0g4MzhsNC'+
			'40NC0yNC4zMWg2LjEzcTI5LjgyLDAsMzMuNDEtMjAuMDkuNDItMy4zNy40Mi00LjQ0LDAtNy4xOC00LjU0LTExdC0xMy4yMi0zLjgxcS0xMC4xNCwwLTE2LjQ5LDUuNDlhMjcuNzksMjcuNzksMCwwLDAtOC42NywxMy41NGgtMjlRODE1LjM0LDk0NS43Myw4MzEuMzEsOTM0LjIxWiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xMDEyLDk1MS40NHEtNC40NC00LjQ0LTE0LjE2LTQuNDQtMTQuNiwwLTIzLjQ3LDExLjc0dC0xNCwzOC4xNmE0NS44NSw0NS44NSwwLDAsMSwxNy4zNC0xMy4yMSw1My4wNiw1My4wNiwwLDAsMSwyMi00Ljc2cTE4LDAsMjguMzMsOS45M3QxMC4zNiwyOC4xMmE2'+
			'NC43Nyw2NC43NywwLDAsMS0xLjA2LDEyLjI3LDY2LjE1LDY2LjE1LDAsMCwxLTEwLjU3LDI2Ljc1LDU1LjUzLDU1LjUzLDAsMCwxLTIwLjgyLDE4LjI5cS0xMi44LDYuNTQtMjkuMDgsNi41NS0yNC43NCwwLTM1LjUyLTEyLjI2dC0xMC43OC0zNS43NGExODMsMTgzLDAsMCwxLDMuMzgtMzEuOTJxNi43Ni0zOC43LDIzLjU4LTU4LjQ2dDQ1LjU2LTE5Ljc3cTIyLjIsMCwzMi4zNSwxMnQ4Ljg4LDMwaC0yNy40OFExMDE2LjQyLDk1NS44OCwxMDEyLDk1MS40NFptLTQzLjI0LDU4LjM2cS04Ljc4LDYuNTYtMTAuODksMTlhMzYsMzYsMCwwLDAtLjYzLDYuNTZxMCw5LjcyLDUuODEsMTV0MTYuODEsNS'+
			'4yOXExMS42NCwwLDE5LjQ2LTd0OS45NC0xOC44MWEzOS4zMSwzOS4zMSwwLDAsMCwuNjMtNi43N2MwLTYuMjEtMS43Ny0xMS4wNi01LjI5LTE0LjU5cy04LjgxLTUuMjktMTUuODYtNS4yOUEzMi41MiwzMi41MiwwLDAsMCw5NjguNzQsMTAwOS44WiIgY2xhc3M9ImNscy0xIi8+CiAgIDxwYXRoIGQ9Ik0xMDg4LjQxLDk0Ny4yMXExNi44MS0yMC41MSw0Ny40Ny0yMC41LDQ2LjA5LDAsNDYuMDksNDkuODlhMTQ5LjA5LDE0OS4wOSwwLDAsMS0yLjUzLDI2LjY0UTExNjUuOSwxMDgwLDExMDguODIsMTA4MHEtNDYuMSwwLTQ2LjEtNTAuMWExNDkuMzMsMTQ5LjMzLDAsMCwxLDIuNTQtMjYuNjVRMTA3'+
			'MS42MSw5NjcuNzIsMTA4OC40MSw5NDcuMjFabTY0LjM5LDMyLjU2cTAtMTItNS0xOC44MVQxMTMxLDk1NC4xOXEtMTYuOTIsMC0yNC43NCwxMi45dC0xMS44NCwzNi4xNWExMzguMjMsMTM4LjIzLDAsMCwwLTIuNTQsMjMuNDdxMCwxMi4yNyw1LDE5dDE2LjgxLDYuNzdxMTEuODMsMCwxOS02LjU2YTQxLjc4LDQxLjc4LDAsMCwwLDExLTE3LDE1OS4xNSwxNTkuMTUsMCwwLDAsNi41Ni0yNS42OUExMzgsMTM4LDAsMCwwLDExNTIuOCw5NzkuNzdaIiBjbGFzcz0iY2xzLTEiLz4KICAgPHBhdGggZD0iTTEyMTguNTUsOTQxLjYxcTEzLjMyLTEwLjI2LDMxLjcyLTEwLjI1LDE2LjA3LDAsMjUuNTgsOC'+
			'4xM3Q5LjUxLDIyLjFhNDQuMiw0NC4yLDAsMCwxLS42Myw3LjQsNDMsNDMsMCwwLDEtMTYuMzksMjcuNTlxLTEzLjQyLDEwLjQ3LTMxLjYxLDEwLjQ3LTE2LjI3LDAtMjUuNjgtOC4xNHQtOS40MS0yMi4xYTUwLjQyLDUwLjQyLDAsMCwxLC42My03LjgyQTQyLjQ2LDQyLjQ2LDAsMCwxLDEyMTguNTUsOTQxLjYxWm00My4zNSwyMi4wOWMwLTUuMjEtMS40Mi05LjE5LTQuMjMtMTEuOTRhMTQuNTQsMTQuNTQsMCwwLDAtMTAuNTctNC4xMnEtNy40MSwwLTEzLjc1LDUuNnQtOCwxNmEyNi4zNiwyNi4zNiwwLDAsMC0uNDMsNS41cTAsNy42LDQuMTMsMTEuNjNhMTQuMzgsMTQuMzgsMCwwLDAsMTAuNDYs'+
			'NCwyMSwyMSwwLDAsMCwxMy44NS01LjVxNi40NS01LjQ5LDguMTUtMTUuNjVBMjcuOSwyNy45LDAsMCwwLDEyNjEuOSw5NjMuN1oiIGNsYXNzPSJjbHMtMSIvPgogIDwvZz4KIDwvZz4KPC9zdmc+Cg==';
		me._svg_7__img.setAttribute('src',hs);
		els.setAttribute('style','position: absolute;top: 0px;left: 0px;width: 100%;height: 100%;-webkit-user-drag:none;pointer-events:none;;');
		els['ondragstart']=function() { return false; };
		el.appendChild(els);
		el.ggSubElement = els;
		el.ggId="Svg 7";
		el.ggDx=-40;
		el.ggDy=-40.44;
		el.ggParameter={ rx:0,ry:0,a:0,sx:1,sy:1 };
		el.ggVisible=true;
		el.className="ggskin ggskin_svg ";
		el.ggType='svg';
		hs ='';
		hs+='height : calc(2.8rem  +  1vw);';
		hs+='left : -10000px;';
		hs+='position : absolute;';
		hs+='top : -10000px;';
		hs+='visibility : inherit;';
		hs+='width : calc(2.8rem  +  1vw);';
		hs+='pointer-events:auto;';
		el.setAttribute('style',hs);
		el.style[domTransform + 'Origin']='50% 50%';
		me._svg_7.ggIsActive=function() {
			if ((this.parentNode) && (this.parentNode.ggIsActive)) {
				return this.parentNode.ggIsActive();
			}
			return false;
		}
		el.ggElementNodeId=function() {
			if ((this.parentNode) && (this.parentNode.ggElementNodeId)) {
				return this.parentNode.ggElementNodeId();
			}
			return player.getCurrentNode();
		}
		me._svg_7.onclick=function (e) {
			player.setUseGyro(!(player.getUseGyro()));
		}
		me._svg_7.ggUpdatePosition=function (useTransition) {
			if (useTransition==='undefined') {
				useTransition = false;
			}
			if (!useTransition) {
				this.style[domTransition]='none';
			}
			if (this.parentNode) {
				var pw=this.parentNode.clientWidth;
				var w=this.offsetWidth;
					this.style.left=((this.ggDx * pw)/100.0 + pw/2 - w/2) + 'px';
				var ph=this.parentNode.clientHeight;
				var h=this.offsetHeight;
					this.style.top=((this.ggDy * ph)/100.0 + ph/2 - h/2) + 'px';
			}
		}
		me._container_1.appendChild(me._svg_7);
		me.divSkin.appendChild(me._container_1);
		player.addListener('sizechanged', function() {
			me.updateSize(me.divSkin);
		});
	};
	this.hotspotProxyClick=function(id, url) {
	}
	this.hotspotProxyDoubleClick=function(id, url) {
	}
	me.hotspotProxyOver=function(id, url) {
	}
	me.hotspotProxyOut=function(id, url) {
	}
	player.addListener('changenode', function() {
		me.ggUserdata=player.userdata;
	});
	me.skinTimerEvent=function() {
		me.ggCurrentTime=new Date().getTime();
	};
	player.addListener('timer', me.skinTimerEvent);
	me.addSkin();
	// Fullscreen can also change through the panorama or the browser's Escape key.
	// Derive both icons from player state rather than the last button clicked.
	function syncFullscreenButtons() {
		var fullscreen=player.getIsFullscreen();
		var buttons=[me._svg_2,me._svg_3];
		for (var i=0;i<buttons.length;i++) {
			var button=buttons[i];
			button.ggVisible=i===0?fullscreen:!fullscreen;
			button.style[domTransition]='none';
			button.style.visibility=button.ggVisible&&(Number(button.style.opacity)>0||!button.style.opacity)?'inherit':'hidden';
		}
	}
	player.addListener('fullscreenenter', syncFullscreenButtons);
	player.addListener('fullscreenexit', syncFullscreenButtons);
	syncFullscreenButtons();
	var style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(document.createTextNode('.ggskin { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 14px;}'));
	document.head.appendChild(style);
	me.skinTimerEvent();
};
