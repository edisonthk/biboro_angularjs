

angular.module('app',['ui.router', 'app.controllers', 'app.directives', 'app.services','ngTagsInput','ngSocial', 'toaster','ngSanitize','angularytics','app.markdown'])

	.config(['$locationProvider','$stateProvider', '$urlRouterProvider','AngularyticsProvider',function($locationProvider,$stateProvider, $urlRouterProvider,AngularyticsProvider){
        
        
        AngularyticsProvider.setEventHandlers(['Console', 'GoogleUniversal']);        
        
        
		$stateProvider
			.state('snippets',{
				url: "/"
			})
			.state('snippets.new',{
				url: "snippet/new"
			})
			.state('snippets.single',{
				url: "snippet/{id:[0-9]+}"
			})
			.state('snippets.single.editor',{
				url: "/edit"
			})
			;

		$urlRouterProvider.otherwise('/');

		var protocol = window.location.protocol;
		if (protocol == "https:" || protocol == 'http:') {
			$locationProvider.html5Mode(!0).hashPrefix("!");   
		}
		
	}])

	.run(['Angularytics',function(Angularytics) {
        Angularytics.init();    
	}]);