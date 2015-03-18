'use strict';

angular.module('app.directives',[])
	.directive('html', function ($compile) {
	  return {
	    restrict: 'A',
	    replace: true,
	    link: function (scope, ele, attrs) {
	      scope.$watch(attrs.html, function(html) {
	        ele.html(html);
	        $compile(ele.contents())(scope);
	      });
	    }
	  };
	})
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