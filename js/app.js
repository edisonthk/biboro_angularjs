

angular.module('app',['ui.router', 'app.controllers', 'app.directives', 'app.services','ngTagsInput','ngSocial', 'toaster','ngSanitize'])

	.config(['$locationProvider','$stateProvider', '$urlRouterProvider',function($locationProvider,$stateProvider, $urlRouterProvider){

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


		$locationProvider.html5Mode(!0).hashPrefix("!");
	}]);