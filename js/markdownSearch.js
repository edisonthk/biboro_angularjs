angular.module("app.markdown",[])
	.controller("markdownCtrl",['$scope',function($scope){
		$scope.mdList=[
			{
				title:'![alt](画像リンク).,',
				description:'外部リンクを参照するさいに、linkを' +
                    '参照リンクに変えます。もしくは、' +
                    '画像をローカルからテキストに' +
                    'ドラッグ＆ドロップしてアップロード' +	
                    'します。<br />',
                    
                tag:'![myimg](img/link)<br />'+
                	'<img width="50" src="https://d30y9cdsu7xlg0.cloudfront.net/png/30706-200.png">'
			},
			{
				title:'**太文字**',
				description:'*（アスタリスク）二つを囲んだ文字が太文字になります。',
                tag:'**サンプル** <strong>サンプル</strong>'
			},
			{
				title:'*斜体*',
				description:'*（アスタリスク）一つを囲んだ文字が斜体になります。',
                tag:'*サンプル* <em>サンプル</em>'
			},
			{
				title:'[リンク](http://...)',
				description: '[]括弧にリンクの表記と()括弧にリンクを書くとリンクになります。',
                tag:'[link1](#) <a href="#">link1</a><br />'+
                	'[link2](/snippet/1) <a href="/snippet/1">link2</a> <br />'
			},
			{
				title:'# 見出し',
				description:'#とスペース１個を空けると該当の行は見出しになります。',
                tag:'# 見出し1　<h1>見出し1</h1><br />' +
                    '## 見出し2　<h2>見出し2</h2><br />' +
                    '### 見出し3　<h3>見出し3</h3><br />'
			},
			{
				title:'&gt; 引用',
				description:'&gt;(半角)とスペース１個を空けると該当の行は引用スタイルになります。',
                tag:'&gt; 引用&nbsp;&nbsp;<blockquote>引用</blockquote>'
			},
				
			{
				title:'* 箇条書き',
				description:'行の始まりに*(アスタリスク)とスペース１つを空けると該当の行は箇条書きになります。',
                tag:'<div class="small-block">'+
                        '* apple <br />'+
                        '* banana <br />'+
                    '</div>'+
                    '<div class="small-block">'+
                        '<ul>'+
                            '<li>apple</li>'+
                            '<li>banana</li>'+
                        '</ul>'+
                    '</div>'
			},
			{
				title:'```#include```',
				description:'コードを```で囲むとコード表記になります。例として<br />'+
                	'```<br />'+
    				'int a = 2;<br /> '+
    				'printf("%d",a);<br />'+
    				'```<br />'+
    				'と書くと次のように表記されます',
                tag:'<pre class="prettify"><code style="padding:10px;"><span class="kwd">int</span><span class="pln"> a </span><span class="pun">=</span><span class="pln"> </span><span class="lit">2</span><span class="pun">;</span><br /><span class="pln">'+
    				'printf</span><span class="pun">(</span><span class="str">"%d"</span><span class="pun">,</span><span class="pln">a</span><span class="pun">);</span></code></pre>'
			},
			{
				title:'`echo`',
				description:'改行なしのコードを書く',
                tag:'<code><span class="str">インラインコード</span></code>'
			}
		];

		var ngWord=['b','r','<','>','/'];

		var replaceAll=function(strBuffer,strBefore,strAfter){
			return strBuffer.split(strBefore).join(strAfter);
		};

		//init $scope.mdConstList
		var mdConstList= JSON.parse(JSON.stringify($scope.mdList));
		Object.freeze(mdConstList);
		//if search-box is changed
		$scope.$watch("searchWord",function(){
			var str='<span class="match">'+$scope.searchWord+'</span>';
			var i;
            $scope.mdList= JSON.parse(JSON.stringify(mdConstList));
			if(null===$scope.searchWord || ""===$scope.searchWord){
				return;
			}
			for(i=0;i<ngWord.length;i++){
				if(-1!=$scope.searchWord.indexOf(ngWord[i])){return;}
			}
			for(i=0;i<$scope.mdList.length;i++){
				$scope.mdList[i].title=replaceAll($scope.mdList[i].title,$scope.searchWord,str);
				$scope.mdList[i].description=replaceAll($scope.mdList[i].description,$scope.searchWord,str);
			}
		});
		//define variable--------------------------------------

        //element text
        var text=document.getElementById("mdSearchBox");
        //key config
        var keyBuf;
        var keyEvent={
            KEY_ESCAPE : 27,
            KEY_0 : 48,
            KEY_Z : 90,
        };

        //-----------------------------------------------------

        //define function---------------------------------------------

        //judge if the key I want is pressed
        var judgePressedKey={
            init:function(e){
                keyBuf=0;
            },
            //if any key is pressed or not
            isAnyKeyPressed:function(e){
                keyBuf=e.keyCode;
                if(keyEvent.KEY_0<=keyBuf && keyBuf<=keyEvent.KEY_Z){
                    return true;
                }
                return false;
            },
        };

        //key down 
        var keydownFunc=function(e){
            judgePressedKey.init(e);
            if(judgePressedKey.isAnyKeyPressed(e)){
                text.focus();
            }
        };

        //------------------------------------------------------

        //main function-------------------------------------------------

        //if keydown
        document.addEventListener("keydown",keydownFunc);


        //-----------------------------------------------------
	}]);