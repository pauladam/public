/* 
The following html source must be uploaded to drive as callback.html and referenced from the Code -> REDIRECT_URL if you want to auto-close the auth tab
It closes the Salesforce Auth window and sends the user back to the Apps Script application: it is not strictly required
Change URL Key to refer to deployed project URL

<link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons.css">
<script>
function callback(){
	window.close();
}

var url = "https://script.google.com/a/macros/google.com/s/AKfycbzhLGMoNU13AIbCteeb75KM2v4SQ9nM9yv9vFYHaPJVlrnN2_Y/exec"+window.location.search;

var script = document.createElement('script');
script.setAttribute('src',url);
document.getElementsByTagName('head')[0].appendChild(script);
</script>

*/
