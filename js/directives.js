'use strict';

var Converter = new Showdown.converter();

angular.module('app.directives',[])
	.directive('html', function ($compile) {
	  return {
	    restrict: 'A',
	    replace: true,
	    link: function (scope, ele, attrs) {
	      scope.$watch(attrs.html, function(html) {
	        ele.html(Converter.makeHtml(html));
	        $compile(ele.contents())(scope);
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

			},
			transclude: true, 
			template: 
				'<div class="dialog-background"></div>'+
				'<div class="dialog">'+
					'<div class="dialog-message">'+
						'<h3>{{title}}</h3>'+
						'<p>{{message}}</p>'+
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

				console.log(scope);
			}
		}
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