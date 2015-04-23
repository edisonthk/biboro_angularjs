'use strict';

// Showdown Extension
// prettify is custom extension, check out more creating showdown extensions
// https://github.com/showdownjs/showdown#creating-markdown-extensions
var prettify = function(converter) {
        return [
            { type: 'output', filter: function(source){

                source = source.replace(/(<pre>)?<code>/gi, function(match, pre) {
                    if (pre) {
                        return '<pre class="prettyprint"><code>';
                    } else {
                        return '<code class="prettyprint">';
                    }
                });

                return source;
            }}
        ];
    };

// Initial Showdown Markdown-HTML Converter object
// - Extends extensions prettify 
//   prettify is custom extension which created on above
var Converter = new Showdown.converter({ extensions: [prettify] });


angular.module('app.directives',['ngSanitize'])
	.directive('markdown', function ($compile) {
	  return {
	    restrict: 'A',
	    scope: {
	    	markdown: '=',
	    },
	    replace: true,
	    template: '<div ng-bind-html="Converter.makeHtml(markdown_edit)"></div>',
	    link: function (scope, ele, attrs) {
	    	scope.Converter = Converter;
	    	var changed = false;
	    	var myId = setInterval(function() {
	    		if(changed) {
	    			prettyPrint();
	    		}
	    		changed = false;
	    	}, 1000);

	    	scope.$watch('markdown', function() {
	    		// scope.markdown_edit = scope.markdown.replace(/</g, function(a, b) {
	    		// 	return '&lt;';
	    		// });
	    		changed = true;
	    	});
	    	
	    	ele.on('$destroy', function() {
	    		clearInterval(myId);
	    	});
	    }
	  };
	})
	.directive('dialogBox',[ '$document',function($document) {

		return {
			restrict: 'E',
			scope: {
				title: '=',
				message: '=',
				outsideClickedEvent: '=',
			},
			transclude: true, 
			template: 
				'<div class="dialog-background"></div>'+
				'<div class="dialog">'+
					'<div class="dialog-message">'+
						'<h3 ng-bind-html="title"></h3>'+
						'<p ng-bind-html="message"></p>'+
					'</div>'+
					'<ng-transclude></ng-transclude>' +
				'</div>',
			link: function(scope, element, attrs){

				// 	// When the click event is fired, we need
	   //              // to invoke the AngularJS context again.
	   //              // As such, let's use the $apply() to make
	   //              // sure the $digest() method is called
	   //              // behind the scenes.
	   //              scope.$apply(function(){
	   //              });
				// });

				document.querySelector(".dialog-background").addEventListener('click',function(e) {
					if(typeof scope.outsideClickedEvent === 'function') {
						scope.outsideClickedEvent();
						scope.$apply();
					}
				});
				
			}
		}
	}])
	.directive('editor', function() {
		return {
			restrict: 'E',
			require: '^ngModel',
			scope: {
				ngModel: '=',
				readyToUploadCallback: '=',
				uploadedCallback: '='
			},
			template: '<div class="clearfix"><div class="cover" ng-style="cover_styles"><div>Drop files here<br/>1MB以下</div></div><textarea ng-model="ngModel"></textarea></div>',
			link: function(scope, e, attrs) {
		      	var textarea = e.find('textarea')[0];

		      	var bugfixed_timeout;
		      	
		      	e[0].ondragover = function(_event) {
		      		_event.preventDefault();
		      		

		      		scope.cover_styles = {display:'block'};

		      		clearTimeout(bugfixed_timeout);
		      		bugfixed_timeout = setTimeout(function() {
		      			scope.cover_styles = {display:'none'};

			      		scope.$apply();
		      		}, 500);

		      		scope.$apply();
        			
		      		return false;
		      	};

		      	e[0].ondrop = function(_event) {
		      		_event.preventDefault();
		      		
		      		var files = _event.dataTransfer.files;
		      		
		      		var success = true;
		      		var formData = new FormData();
					for (var i = 0; i < files.length; i++) {
						if(files[i].size > 1000000) {
							success = false;
							var data = {
								errors : "ファイルサイズは1MB以下になります",
							};

							if(typeof scope.uploadedCallback !== 'undefined'){
								scope.uploadedCallback(false, data, 413);
							}
							break;	
						}
					  	formData.append('files[]', files[i]);
					}

					if(success) {
						// when success, AJAX send
						var xhr = new XMLHttpRequest();
						xhr.open('POST', '/json/images/upload');
						xhr.onreadystatechange = function () {
							if(xhr.readyState === 4) {
								var res = xhr.responseText
								try{
									var data = JSON.parse(res);
								  	if (xhr.status === 200) {

								  		scope.ngModel = '\n\n';

								  		if(Array.isArray(data)) {
								  			for (var i = 0; i < data.length; i++) {
								  				scope.ngModel += "![alt text]("+data[i].message.destination_path+data[i].message.filename+")\n";
								  			}
								  			
								  		}else{
								  			scope.ngModel += "![alt text]("+data.message.destination_path+data.message.filename+")\n";	
								  		}
								  		
								  		scope.$apply();
								  		if(typeof scope.uploadedCallback !== 'undefined'){
								  			scope.uploadedCallback(true, data, xhr.status);
								  		}
								  	} else {
								  		// failed to uploaded
								    	scope.uploadedCallback(false, data, xhr.status);
								  	}
								}catch(err) {
									scope.uploadedCallback(false, err, xhr.status);
								}
							}
						};

						
						xhr.send(formData);	
					}

					scope.$apply();
					
		      		return false;
		      	};
		    }
		};
	})
	.directive('share', ['$location',function(l) {
		return {
			restrict: 'E',
			scope: {
				description: '=',
				title: '='
			},
			templateUrl: 'components/share.html',
			link: function(scope, element, attrs){
				scope.location = l;
			}
		}
	}])
	.directive('onFinishRender', ['$timeout',function(Timeout) {
		return {
			restrict: 'A',
			scope: {
				onFinishRender: '=',
			},
			link: function(scope, ele, attrs) {

				if (scope.$parent.$last === true) {
					Timeout(function() {
						if(typeof scope.onFinishRender === 'function') {
		                	scope.onFinishRender();
		                }
					});
	            }
			}
		};
	}])
	.directive('animator',['$rootScope',function($rootScope){

		return {
			scope: {
				id: '@'
			},
			transclude: true,
			template: '<div class="animator"><img /><ng-transclude /></div>',
			link: function(scope, element, attrs, ctrl){
				

				var infoImgs = [];
				for (var i = 0; i < 19; i++) {
					var leadingZeroName = ("00000" + i).substr(-4);
					infoImgs.push("imgs/info/info"+leadingZeroName+".png");
				};
				
		      // scope.image = "imgs/info/info0001.png";
		    },    
		};
	}]);