// ==UserScript==
// @name         RPLT
// @description  Records page load times
// @author       artiusastro
// @match        https://ayubatif.me/*
// ==/UserScript==
/**
 * Records page load time after response end. Saves a cookie for time data and sample number.
 * Once data collection complete, time data is saved to a local file.
 */
function dataCollection() {
	
	const NUM_SAMPLES = 200;
	
	/**
	* cn: cookie name
	*/
	function getCookie(cn){
		return new Promise((resolve) => {
			let n = cn + "=";
			let dc = decodeURIComponent(document.cookie);
			let ca = dc.split(';');
			for(var i = 0; i <ca.length; i++) {
				let c = ca[i];
				while (c.charAt(0) == ' ') {
					c = c.substring(1);
				}
				if (c.indexOf(n) == 0) {
					resolve(c.substring(n.length, c.length));
				}
			}
			resolve((cn == "n")? 0 : "");
		});
	}
		
	/**
	* cn: cookie name; x: cookie data; min: minutes to expiry
	*/
	function setCookie(cn, x, min) {
		return new Promise((resolve) => {
			let d = new Date();
			d.setTime(d.getTime() + (min*60*1000));
			let expiry = "expires="+ d.toUTCString();
			document.cookie = cn + "=" + x + ";" + expiry + ";path=/";
			resolve();
		});
	}
	
	/**
	* fn: file name; x: file data; xtype: file content type
	*/
	function download(fn, x, xtype) {
    let a = document.createElement("a");
    let file = new Blob([x], {type: xtype});
    a.href = URL.createObjectURL(file);
    a.download = fn;
    a.click();
	}
	
  /**
	* converts 'b' in string to '\n' and returns a new string
	* x: string containing 'b'
	*/
  function b2newline(x){
    return x.split('b').join('\n').substring(1,x.length);
	}
  
  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
	}
	
	function recordPageLoadTime(){
    return new Promise((resolve) => {
      window.addEventListener("load", function measureLoadTime() {
        window.removeEventListener("load", measureLoadTime);
        setTimeout(function() {
          let t = performance.timing;
          let loadTime = t.loadEventEnd - t.responseEnd;
          resolve(loadTime);
        }, 0);
      });
    });
  }

	recordPageLoadTime().then(t=>{
    let complete = false;
    let ts = "";
		/* append page load to previous samples */
    tp = getCookie("t").then(tvals => {
			ts = tvals.concat('b'+t)
			setCookie("t",ts,10);
		});
		/* update sample number and check for completion */
		np = getCookie("n").then(nval => {
      let n = parseInt(nval,10);
			complete = (n>NUM_SAMPLES-1)? true : false;
      setCookie("n",n+1,10);
		});
		/* download if done or reload for next sample */
    Promise.all([tp,np]).then(() => {
			if(complete) {
        results = b2newline(ts)
        console.log(results);
        download(window.location.hostname+"-pageloadtimes.txt", results);
      }
      else location.reload(true);
		});
  });
	
};

dataCollection();