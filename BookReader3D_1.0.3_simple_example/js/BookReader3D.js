
init = function(links,div,cy){
	webGlDiv = div;
	fov = 30;
	cameraY = (cy == undefined || isNaN(cy)) ? 0 : cy;
	mousePosition = new Point(0,0);
	lastMousePosition = new Point(0,0);
	mousePositionOnMouseDown = new Point(0,0);
	focusPoint = new THREE.Vector3(0,0,0);
	book = null;
	mouseWheelEvent=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
	scene=null;
	
	
	/*setDivSize();
	
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	stats.domElement.style.borderTop = '6px solid #000022'; 
	document.body.appendChild( stats.domElement );*/
				
	if (!Detector.webgl){
		Detector.addGetWebGLMessage();
	}
	
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(document.getElementById(webGlDiv).clientWidth, document.getElementById(webGlDiv).clientHeight);

	camera = new THREE.PerspectiveCamera(30, document.getElementById(webGlDiv).clientWidth /document.getElementById(webGlDiv).clientHeight, 1, 1000);
	camera.position.set(0, cameraY, 500);
	
	scene = new THREE.Scene();
	scene.add( camera );
	camera.lookAt( scene.position );
				
	//document.getElementById('info').innerHTML="Turn page by draging its edge. Use mouse wheel for zoom.";			
	document.getElementById(webGlDiv).appendChild(renderer.domElement);

	window.addEventListener( 'resize', onWindowResize, false );
	document.getElementById(webGlDiv).addEventListener( 'mousedown', onMouseDown, false );
	document.getElementById(webGlDiv).addEventListener(mouseWheelEvent, zoom, false);
	
	//  BOOK   **************************
	book = new Book(links);
	for(var i=0;i<book.pages.length;i++){
		scene.add(book.pages[i].fakePage);
	}
	//updatePagesInfo();
	animate();
}

Page = function(id,frontImage,backImage){
	this.id = id;
	this.mesh = null;
	this.width = 145;
	this.heigth = 232;
	this.offset = 0;
	this.force = 0;
	this.angle = 90;
	this.maxAngle = 75;
	this.rotation = 0;
	this.curlProgress = 0;
	this.counter = 0;
	this.materials = [];
	this.isTurnedLeft = true;
	this.rotationCompleted = true;
	this.mod = null;
	this.bend = null;
	this.fakePage = new THREE.Object3D();
	var textureFront,textureBack;

	
	if(frontImage != undefined) textureFront = THREE.ImageUtils.loadTexture(frontImage);
	if(backImage != undefined) textureBack = THREE.ImageUtils.loadTexture(backImage);

	for(var i=0;i<6;i++){
		if(i<4) this.materials[i] = new THREE.MeshBasicMaterial( { color: 0xC0C0C0 } );
		if(i==4) this.materials[i] = textureFront == undefined ? new THREE.MeshBasicMaterial( { color: 0xa1a1a1 } ) : new THREE.MeshBasicMaterial( { map: textureFront } );
		if(i==5) this.materials[i] = textureBack == undefined ? new THREE.MeshBasicMaterial( { color: 0xa1a1a1 } ) : new THREE.MeshBasicMaterial( { map: textureBack } );
	}
	
	var pageGeometry = new THREE.CubeGeometry(this.width,this.heigth,0.1,15,23,1,this.materials);
	this.mesh = new THREE.Mesh(pageGeometry, new THREE.MeshFaceMaterial());
	this.mesh.position.x = -(this.width/2);
	this.fakePage.add(this.mesh);
	
	this.mod = new MOD3.ModifierStack( new MOD3.LibraryThree(), this.mesh);
	this.bend = new MOD3.Bend(0,1,0);
	this.bend.constraint = MOD3.ModConstant.LEFT;
	this.mod.addModifier(this.bend);
	//this.mod.apply();
	
	// Methods
	this.setRotation = function(rot){
		this.rotation = rot;
		this.fakePage.rotation.y = this.rotation;
	}
	
	this.setZ = function(z){
		this.fakePage.position.z = z;
	}
	
	this.getZ = function(){
		return this.fakePage.position.z;
	}
	
	this.applyDeformation = function(){
		this.bend.force = this.force;
		this.bend.offset = this.offset;
		this.bend.setAngle(this.angle*Math.PI/180);
		this.fakePage.rotation.y = this.rotation;
	}
	
	this.setDefaults = function(){
		this.offset = 0;
		this.force = 0;
		this.angle = 90;
		this.maxAngle = 75;
		this.curlProgress = 0;
		this.counter = 0;
	}
	
	this.setDeformation = function(mpx,mpy,mpomdx,lastmpy){
		if(this.isTurnedLeft){
			if( mpx - mpomdx < 300){
				if( mpx - mpomdx <0){
					mpomdx = mpx;
					this.curlProgress = 0;
					this.rotation = 0;
					this.offset = 1;
					this.force = 0;
					this.angle = 90;
				}
				else{
					if(this.counter === 0){
						if(lastmpy - mpy == 0 && ((this.angle < 90 - this.maxAngle) || (this.angle > 90 + this.maxAngle))) this.angle = (this.angle > 90) ? 90 + this.maxAngle : 90 - this.maxAngle;
						if(lastmpy - mpy < 0) this.angle = (this.angle > 90 - this.maxAngle) ? this.angle-1 : 90 - this.maxAngle;
						if(lastmpy - mpy > 0) this.angle = (this.angle < 90 + this.maxAngle) ? this.angle+1 : 90 + this.maxAngle;
						if(this.angle === 90) this.counter = 10;
					}
					else{
						this.counter--;
					}
					this.offset= 0.9-(0.7*( mpx - mpomdx )/300);
					this.force= -3.2+(1.5*( mpx - mpomdx )/300);
					this.maxAngle= 75-70*( mpx - mpomdx )/300;
					this.curlProgress = mpx - mpomdx;
				}
			}

					
			if(( mpx - mpomdx )>=300 && ( mpx - mpomdx )<=600){
				this.rotation = (mpx - mpomdx-300 )*Math.PI/300;
				this.offset = (0.2+(0.1*(mpx - mpomdx - 300)/300) < 0.3) ? 0.2+ 0.1*(mpx - mpomdx - 300)/300 : 0.3;
				this.maxAngle= 5+10*( mpx - mpomdx-300 )/300;
				
				this.curlProgress = mpx - mpomdx;
						
				if(lastmpy - mpy < 0) this.angle = (this.angle > 90 - this.maxAngle) ? this.angle-1 : 90 - this.maxAngle;
				if(lastmpy - mpy > 0) this.angle = (this.angle < 90 + this.maxAngle) ? this.angle+1 : 90 + this.maxAngle;
						
				if( mpx - mpomdx <450){
					this.force = (-1.8+0.6*(mpx - mpomdx - 300)/150);
				}
				else{
					this.force = (-1.2+1.2*(mpx - mpomdx - 450)/150 <0) ? -1.2+ 1.2*(mpx - mpomdx - 450)/150 : 0;
				}
			}
			
			if(mpx - mpomdx > 600){
				mpomdx = mpx - 600;
				this.curlProgress = 600;
				this.rotation = Math.PI;
				this.offset = 0;
				this.force = 0;
				this.angle = 90;
			}
			
		}
				
		else{
			if(mpx - mpomdx > -300){
				if( mpx - mpomdx > 0){
					mpomdx = mpx;
					this.curlProgress = 0;
					this.rotation = Math.PI;
					this.offset = 0;
					this.force = 0;
					this.angle = 90;
				}
				else{
					if(this.counter === 0){
						if(lastmpy - mpy == 0 && ((this.angle < 90 - this.maxAngle) || (this.angle > 90 + this.maxAngle))) this.angle = (this.angle > 90) ? 90 + this.maxAngle : 90 - this.maxAngle;
						if(lastmpy - mpy < 0) this.angle = (this.angle > 90 - this.maxAngle) ? this.angle-1 : 90 - this.maxAngle;
						if(lastmpy - mpy > 0) this.angle = (this.angle < 90 + this.maxAngle) ? this.angle+1 : 90 + this.maxAngle;
						if(this.angle === 90) this.counter = 10;
					}
					else{
						this.counter--;
					}
							
					this.curlProgress = mpx - mpomdx;
					this.offset = 0.9 + (0.7*( mpx - mpomdx )/300);
					this.force= 3.2 + (1.5*( mpx - mpomdx )/300);
					this.maxAngle= 75 + 70*( mpx - mpomdx )/300;
				}
			}
					
			if( mpx - mpomdx <= -300 && mpx - mpomdx >= -600){
				this.rotation = Math.PI + ( mpx - mpomdx + 300 )*Math.PI/300;
				this.offset= (0.2-0.1*(mpx - mpomdx + 300)/300<0.3) ? 0.2-(0.1*( mpx - mpomdx + 300)/300) : 0.3;
				this.maxAngle= 5-10*( mpx - mpomdx +300)/300;
					
				this.curlProgress = mpx - mpomdx;
						
				if(lastmpy - mpy < 0) this.angle = (this.angle > 90 - this.maxAngle) ? this.angle-1 : 90 - this.maxAngle;
				if(lastmpy - mpy > 0) this.angle = (this.angle < 90 + this.maxAngle) ? this.angle+1 : 90 + this.maxAngle;
						
				if(mpx - mpomdx > -450){
					this.force= (1.7+0.6*( mpx - mpomdx + 300)/150);
				}
				else{
					this.force= (1.1+1.1*( mpx - mpomdx + 450)/150 >0) ? 1.1+1.1*( mpx - mpomdx + 450)/150 : 0;
				}
			}
					
			if( mpx - mpomdx < -600){
				mpomdx = mpx +600;
				this.curlProgress = -600;
				this.rotation = 0;
				this.offset = 0;
				this.force = 0;
				this.angle = 90;
			}
		}
		this.applyDeformation();
	}	
} 

Book = function(images){
	this.numberOfPages = images.length;
	this.pages = Math.ceil(this.numberOfPages/2)<6 ? new Array(Math.ceil(this.numberOfPages/2)) : new Array(6);
	this.leftPage = null;
	this.rightPage = null;
	this.currentPage = null;
	this.removedPage = null;
	this.images = [];
	
	for(var i=0;i<this.numberOfPages;i+=2){
		this.images.push({back: images[i], front: images[i+1]}); 
	}	
	
	for(var i=0;i<this.pages.length;i++){
		this.pages[i] = new Page(i,this.images[i].front,this.images[i].back);
		if(i>0){
			this.pages[i].setRotation(Math.PI);
			this.pages[i].isTurnedLeft = false;
		}
		if(i==0){
			this.pages[i].setZ(-0.1*(this.pages.length-1));
		}
		else{
			this.pages[i].setZ(0.1*(-i));
		}
	}
	
	this.leftPage = this.pages[0];
	this.rightPage = this.pages[1];
	
	
	// Methods
	this.selectPage = function (page){
		page.rotationCompleted = true;
		this.currentPage = page;
		page.setZ(0);
	}
	
	this.jumpToPage = function (number){
		var index;
		var turnedLeft;
		if(number < 1 || number > this.numberOfPages){
			alert('Requested page does not exist. This book has '+this.numberOfPages+' pages.');
		}
		else{
			index = Math.ceil(number/2) - 1;
			turnedLeft = (number%2 == 0) ? true : false;
			// left: 3 pages right: 3 pages turned: left
				if(index > 1 && index < this.images.length - 3 && turnedLeft){
					for(var i=index-2,j=0;i<index+4;i++,j++){
						this.pages[j] = new Page(i,this.images[i].front,this.images[i].back);
						if(j>2){
							this.pages[j].setRotation(Math.PI);
							this.pages[j].isTurnedLeft = false;
							this.pages[j].setZ(-0.1*j);
						}
						else  this.pages[j].setZ(0.1*j - 0.1*(this.pages.length-1));
					}
					this.leftPage = this.pages[2];
					this.rightPage = this.pages[3];
				}
				// 3,3,right
				if(index > 2 && index < this.images.length - 2 && !turnedLeft){
					for(var i=index-3,j=0;i<index+3;i++,j++){
						this.pages[j] = new Page(i,this.images[i].front,this.images[i].back);
						if(j>2){
							this.pages[j].setRotation(Math.PI);
							this.pages[j].isTurnedLeft = false;
							this.pages[j].setZ(-0.1*j);
						}
						else  this.pages[j].setZ(0.1*j - 0.1*(this.pages.length-1));

					}
					this.leftPage = this.pages[2];
					this.rightPage = this.pages[3];
				}
				
				// 0,6
				if(index == 0 && !turnedLeft){
					for(var i=0;i<this.pages.length;i++){
						this.pages[i] = new Page(i,this.images[i].front,this.images[i].back);

						this.pages[i].setRotation(Math.PI);
						this.pages[i].isTurnedLeft = false;
						this.pages[i].setZ(-i*0.1);						
					}	
					this.leftPage = null;
					this.rightPage = this.pages[0];
				}
				// 1,5
				if(index == 0 && turnedLeft || index == 1 && !turnedLeft){
					for(var i=0;i<this.pages.length;i++){
						this.pages[i] = new Page(i,this.images[i].front,this.images[i].back);
						if(i>0){
							this.pages[i].setRotation(Math.PI);
							this.pages[i].isTurnedLeft = false;
						}
						if(i==0){
							this.pages[i].setZ(-0.1*(this.pages.length-1));
						}
						else{
							this.pages[i].setZ(0.1*(-i));
						}
					}				
					this.leftPage = this.pages[0];
					this.rightPage = this.pages[1];
				}
				// 2,4
				if(index == 1 && turnedLeft || index == 2 && !turnedLeft){
					for(var i=0;i<this.pages.length;i++){
						this.pages[i] = new Page(i,this.images[i].front,this.images[i].back);
						if(i>1){
							this.pages[i].setRotation(Math.PI);
							this.pages[i].isTurnedLeft = false;
							this.pages[i].setZ(-i*0.1);
						}
						else{
							this.pages[i].setZ(0.1*i - 0.1*(this.pages.length-1));
						}
					}
					this.leftPage = this.pages[1];
					this.rightPage = this.pages[2];
				}
				// 6,0
				if(index == this.images.length-1 && turnedLeft){
					for(var i=this.images.length-this.pages.length,j=0;i<this.images.length;i++,j++){
						this.pages[j] = new Page(i,this.images[i].front,this.images[i].back);
						this.pages[j].setZ(j*0.1 - 0.1*(this.pages.length-1));
					}
					this.leftPage = this.pages[this.pages.length-1];
					this.rightPage = null;
				}
				// 5,1
				if(index == this.images.length-1 && !turnedLeft || index == this.images.length-2 && turnedLeft){
					for(var i=this.images.length-this.pages.length,j=0;i<this.images.length;i++,j++){
						this.pages[j] = new Page(i,this.images[i].front,this.images[i].back);
						if(j==this.pages.length-1){
							this.pages[j].setZ(-0.1*(this.pages.length-1));
							this.pages[j].setRotation(Math.PI);
							this.pages[j].isTurnedLeft = false;
						}
						else{
							this.pages[j].setZ(0.1*j - 0.1*(this.pages.length-1));
						}
					}
					this.leftPage = this.pages[this.pages.length-2];
					this.rightPage = this.pages[this.pages.length-1];
				}
				// 4,2
				if(index == this.images.length-2 && !turnedLeft || index == this.images.length-3 && turnedLeft){
					for(var i=this.images.length-this.pages.length,j=0;i<this.images.length;i++,j++){
						this.pages[j] = new Page(i,this.images[i].front,this.images[i].back);
						
						if(j > this.pages.length-3){
							this.pages[j].setZ(-0.1*j);
							this.pages[j].setRotation(Math.PI);
							this.pages[j].isTurnedLeft = false;
						}
						else{
							this.pages[j].setZ(0.1*j - 0.1*(this.pages.length-1));
						}

					}
					this.leftPage = this.pages[this.pages.length-3];
					this.rightPage = this.pages[this.pages.length-2];
				}

		}
	}
	
	this.autoCompleteRotation = function(page){
		if(!page.rotationCompleted){
			if(page.isTurnedLeft){
				if(page.curlProgress < 300){
					if(page.curlProgress <= 0){
						page.rotationCompleted = true;
						page.setDefaults();
						page.rotation = 0;
						
						if(this.pages.indexOf(page) == 0){
							page.setZ(-0.1*(this.pages.length-1));
						}
						else{
							page.setZ(this.pages[this.pages.indexOf(page)-1].getZ() +0.1 );
						}
					
						if(this.currentPage === page) this.currentPage = null;

					}
					else{
						page.offset = 0.2- (0.7*(page.curlProgress -300)/300);
						page.force = -1.7 + (1.5*(page.curlProgress -300)/300);
						page.curlProgress -= 10;
					}
				
				}
				else{
					if(page.curlProgress >= 600){
						page.rotationCompleted = true
						page.setDefaults();
						page.rotation = Math.PI;
						page.isTurnedLeft=false;
						
						if(this.pages.indexOf(page) == this.pages.length-1){
							page.setZ(-0.1*(this.pages.length-1));
						}
						else{
							page.setZ(this.pages[this.pages.indexOf(page)+1].getZ() +0.1 );
						}
					
						if(this.pages.indexOf(page) == 2 && this.pages[0].id > 0){
							this.removedPage = this.pages.pop();
							for(var i=0;i<this.pages.length;i++){
								if(this.pages[i].isTurnedLeft){
									this.pages[i].setZ(this.pages[i].getZ() +0.1 );
								}
								else{
									this.pages[i].setZ(this.pages[i].getZ() -0.1 );
								}
							}
							this.pages.unshift(new Page(this.pages[0].id -1,this.images[this.pages[0].id -1].front,this.images[this.pages[0].id -1].back));
							this.pages[0].setZ(-0.5);
						}
					
						if(this.currentPage === page) this.currentPage = null;
						this.leftPage = this.pages[this.pages.indexOf(page)-1];
						this.rightPage = page;
					}
					else{
						page.rotation = (page.curlProgress-300 )*Math.PI/300;
						page.offset = (0.2+(0.1*(page.curlProgress - 300)/300) < 0.3) ? 0.2+ 0.1*(page.curlProgress - 300)/300 : 0.3;
						if( page.curlProgress <450){
							page.force = (-1.8+0.6*(page.curlProgress - 300)/150);
						}
						else{
							page.force = (-1.2+1.2*(page.curlProgress - 450)/150 <0) ? -1.2+ 1.2*(page.curlProgress - 450)/150 : 0;
						}
						page.curlProgress += 10;
					}			
				}		
			}
		
			else{
				if(page.curlProgress > -300){
					if(page.curlProgress >= 0){
						page.rotationCompleted = true;
						page.setDefaults();
						page.rotation = Math.PI;
					
						if(this.pages.indexOf(page) == this.pages.length-1){
							page.setZ(-0.1*(this.pages.length-1));
						}
						else{
							page.setZ(this.pages[this.pages.indexOf(page)+1].getZ() +0.1 );
						}
					
						if(this.currentPage === page) this.currentPage = null;
					}
					else{
						page.offset = 0.2 + (0.7*(page.curlProgress +300)/300);
						page.force = 1.7 + (1.5*(page.curlProgress +300)/300);
						page.curlProgress += 10;
					}
				}
				else{
					if(page.curlProgress <= -600){
						page.rotationCompleted = true
						page.setDefaults();
						page.rotation = 0;
						page.isTurnedLeft=true;
						
						if(this.pages.indexOf(page) == 0){
							page.setZ(-0.1*(this.pages.length-1));
						}
						else{
							page.setZ(this.pages[this.pages.indexOf(page)-1].getZ() +0.1 );
						}

						if(this.pages.indexOf(page) == 3 && this.pages[this.pages.length-1].id < this.images.length -1){
							this.removedPage = this.pages.shift();
							for(var i=0;i<this.pages.length;i++){
								if(this.pages[i].isTurnedLeft){
									this.pages[i].setZ(this.pages[i].getZ() -0.1 );
								}
								else{
									this.pages[i].setZ(this.pages[i].getZ() +0.1 );
								}
							}
							this.pages.push(new Page(this.pages[4].id +1,this.images[this.pages[4].id +1].front,this.images[this.pages[4].id +1].back));
							this.pages[5].setRotation(Math.PI);
							this.pages[5].isTurnedLeft = false;
							this.pages[5].setZ(-0.5);
						}

					
						if(this.currentPage === page) this.currentPage = null;
						
						this.rightPage = this.pages[this.pages.indexOf(this.rightPage)+1];
						this.leftPage = page;
						
					}
					else{
						page.rotation = Math.PI + (page.curlProgress + 300 )*Math.PI/300;
						page.offset= (0.2-0.1*(page.curlProgress + 300)/300<0.3) ? 0.2-(0.1*(page.curlProgress + 300)/300) : 0.3;
						if(page.curlProgress > -450){
							page.force= (1.7+0.6*( page.curlProgress + 300)/150);
						}
						else{
							page.force= (1.1+1.1*( page.curlProgress + 450)/150 >0) ? 1.1+1.1*(page.curlProgress + 450)/150 : 0;
						}
						page.curlProgress -= 10;
					}	
				}
			}
		}
		page.applyDeformation();
		updatePagesInfo();
	}
}
// end BOOK ==============================================

function updatePagesInfo(){
	var lp = (book.leftPage !== null && book.leftPage !== undefined) ? book.leftPage.id*2+2 : 'none';
	var rp = (book.rightPage !== null && book.rightPage !== undefined) ? book.rightPage.id*2+1 : 'none';
	//document.getElementById('pagesInfo').innerHTML='Pages: '+lp+' and '+rp+' of '+book.numberOfPages;
}

function zoom(event){
	event.preventDefault();
	//event.stopPropagation();
	
	var wheelDelta = event.detail ? event.detail / -3 : event.wheelDelta / 120;
	fov -= wheelDelta;
	if(fov <= 1) fov = 1;
	if(fov >= 50) fov = 50;
	camera.projectionMatrix = THREE.Matrix4.makePerspective( fov, document.getElementById(webGlDiv).clientWidth / document.getElementById(webGlDiv).clientHeight, 1, 1000 );
	if(fov >= 24){
	
		camera.position.set(0, cameraY, 500);
		camera.lookAt( scene.position );
		//document.getElementById('info').style.color='black';
		//document.getElementById('info').innerHTML="Turn page by draging its edge. Use mouse wheel for zoom.";
	}
	else{
		//document.getElementById('info').style.color='red';
		//document.getElementById('info').innerHTML="Drag the book to move it on the screen. If you want to turn page, ZOOM OUT first.";
	}
}

function onMouseDown(event) {
	event.preventDefault();
	//event.stopPropagation();
		if(book.currentPage !== null) return;
	
	//document.querySelector("body").style.cursor = "none";
	
	if(fov < 24){
		
	}
	else{
		// select page for rotation
		if(event.clientX < document.getElementById(webGlDiv).clientWidth/2){
			if(book.leftPage !== undefined && book.leftPage !== null)book.selectPage(book.leftPage);
		}
		else{
			if(book.rightPage !== null && book.rightPage !== undefined)book.selectPage(book.rightPage);
		}
	}
	
	document.getElementById(webGlDiv).addEventListener( 'mousemove', onMouseMove, false );
	document.getElementById(webGlDiv).addEventListener( 'mouseup', onMouseUp, false );
	document.getElementById(webGlDiv).addEventListener( 'mouseout', onMouseOut, false );
	document.getElementById(webGlDiv).removeEventListener(mouseWheelEvent, zoom, false);
	
	mousePositionOnMouseDown.x = event.clientX;
	mousePositionOnMouseDown.y = event.clientY;
	lastMousePosition.x = event.clientX;
	lastMousePosition.y = event.clientY;
}

function Point(x,y){
	this.x = x;
	this.y = y;
}


function onMouseMove( event ) {
	event.preventDefault();
	//event.stopPropagation();

	mousePosition.x = event.clientX;
	mousePosition.y = event.clientY;
		if(fov < 24){
		var xMove = lastMousePosition.x - mousePosition.x;
		var yMove = lastMousePosition.y - mousePosition.y;
		
		focusPoint.x = focusPoint.x + xMove/5;
		focusPoint.y = focusPoint.y - yMove/5;
		
		camera.position.x = camera.position.x + xMove/5;
		camera.position.y = camera.position.y - yMove/5;
		camera.lookAt(focusPoint);
			
	}
	else{
		if(book.currentPage !== null){
			book.currentPage.setDeformation(mousePosition.x, mousePosition.y, mousePositionOnMouseDown.x, lastMousePosition.y);
		}
	}
	
	lastMousePosition.y = mousePosition.y;
	lastMousePosition.x = mousePosition.x;
	}

function onMouseUp( event ) {
	event.preventDefault();
	//event.stopPropagation();

	if(fov < 24){
	}
	else{
		if(book.currentPage !== null)book.currentPage.rotationCompleted = false;
	}
	
	document.querySelector("body").style.cursor = "auto";
	document.getElementById(webGlDiv).removeEventListener( 'mousemove', onMouseMove, false );
	document.getElementById(webGlDiv).removeEventListener( 'mouseup', onMouseUp, false );
	document.getElementById(webGlDiv).removeEventListener( 'mouseout', onMouseOut, false );
	document.getElementById(webGlDiv).addEventListener(mouseWheelEvent, zoom, false);
	
}

function onMouseOut( event ) {
	event.preventDefault();
	//event.stopPropagation();
	
	if(fov < 24){
	}
	else{
		if(book.currentPage !== null)book.currentPage.rotationCompleted = false;
	}
	
	document.querySelector("body").style.cursor = "auto";
	document.getElementById(webGlDiv).removeEventListener( 'mousemove', onMouseMove, false );
	document.getElementById(webGlDiv).removeEventListener( 'mouseup', onMouseUp, false );
	document.getElementById(webGlDiv).removeEventListener( 'mouseout', onMouseOut, false );
	document.getElementById(webGlDiv).addEventListener(mouseWheelEvent, zoom, false);
	
	}
	
function onWindowResize() {
	//setDivSize();
	camera.aspect = document.getElementById(webGlDiv).clientWidth / document.getElementById(webGlDiv).clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( document.getElementById(webGlDiv).clientWidth, document.getElementById(webGlDiv).clientHeight);
	}
	
function animate(){
	requestAnimationFrame(animate);	
	//stats.update();
	if(book.currentPage !== null) book.autoCompleteRotation(book.currentPage);
	if(book.removedPage !== null){
		scene.remove(book.removedPage.fakePage);
		book.removedPage = null;
		for(var i=0;i<book.pages.length;i++){
			scene.add(book.pages[i].fakePage);
		}
	}
	render();

}
		
function render(){
	for(var i=0;i<book.pages.length;i++){
		book.pages[i].mod.apply();
	}
	renderer.render(scene,camera);
}

function jump(){
	var number = document.getElementById("Page").value;
	for(var i=0;i<book.pages.length;i++){
		scene.remove(book.pages[i].fakePage);
	}
	
	book.jumpToPage(number);
	
	for(var i=0;i<book.pages.length;i++){
		scene.add(book.pages[i].fakePage);
	}
	updatePagesInfo()
}

function setDivSize(){
	document.getElementById(webGlDiv).style.height = (window.innerHeight-53)+'px';
	document.getElementById(webGlDiv).style.width = window.innerWidth+'px';
}
