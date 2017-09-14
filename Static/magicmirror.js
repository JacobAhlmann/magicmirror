window.onload=function(){
  clock();
  weather();
}


function clock() {
  var today = new Date();
  var m = today.getMinutes();
  if (m < 10) {m = "0" + m};
  document.getElementById("clock").innerHTML=today.getHours() + ":" + m;
  setTimeout(clock, 1000);
}


function weather(){
  getRequest("https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.096962/lat/59.346828/data.json", null).then(function(weatherdata){
    console.log(weatherdata)
    // handle weird UTC-shifts
    var UTCOffset=0;
    while (weatherdata.timeSeries[UTCOffset].validTime.substring(11, 13)<new Date().getUTCHours()){
      UTCOffset++;
    }

    // render current weather
    var weather_data_now=weatherdata.timeSeries[UTCOffset].parameters
    renderWeather(weather_data_now[11].values, weather_data_now[14].values, weather_data_now[3].values, weather_data_now[18].values)
    //render the 24h forecast
    var forecast_24_temperatures=[]
    var forecast_24_percipitation=[]
    var counter=UTCOffset
    //For some reason, the order of the parameters change at hour 6. Dont ask.
    for (; counter<(6); counter++){
      forecast_24_temperatures.push(weatherdata.timeSeries[counter].parameters[11].values[0])  //temps
      forecast_24_percipitation.push(weatherdata.timeSeries[counter].parameters[3].values)    //percipitation
    }
    for (;counter<(24+UTCOffset); counter++){
      forecast_24_temperatures.push(weatherdata.timeSeries[counter].parameters[1].values[0])  //temperatures
      forecast_24_percipitation.push(weatherdata.timeSeries[counter].parameters[16].values)   //percipitation
    }

    // handle time for the chart label. Only want to show every 4:th hour on the x-axis
    var forecast_24_times=[]
    var currentHour=new Date().getHours();
    for (var i=0, hourCounter=currentHour; i<24; i++){
      if (hourCounter>23){hourCounter=0}
      if (hourCounter%4){
        forecast_24_times.push("")}
      else{forecast_24_times.push(hourCounter)}
      hourCounter++;
    }
    renderChart(forecast_24_times, forecast_24_temperatures, forecast_24_percipitation)
  })
  setTimeout(weather, 1000*60*5) //refresh weather data every 5 minutes
}


function renderWeather(_current_temperature, windspeed, percipitationmm, _weathersymbol){
  var weathersymbols= ["Clear skies","Nearly clear sky","Variable cloudiness","Halfclear sky","Cloudy sky","Overcast","Fog","Light rain showers","Moderate rain showers","Heavy rain showers","Thunderstorm","Light sleet showers","Moderate sleet showers","Heavy sleet showers","Light snow showers","Moderate snow showers","Heavy snow showers","Light rain","Moderate rain","Heavy rain","Thunder","Light sleet","Moderate sleet","Heavy sleet","Light snowfall","Moderate snowfall","Heavy snowfall"];
  var weatherinfo= _current_temperature +" &#8451</br>" +windspeed+" m/s </br>"+weathersymbols[_weathersymbol-1]+"</br>";
  if (percipitationmm!=0) {weatherinfo="</br>"+weatherinfo+percipitationmm+" mm"};
  document.getElementById("weather").innerHTML=weatherinfo
}


function renderChart(times, temperatures, percipitation){
  var ctx = document.getElementById("myChart").getContext('2d');
  var renderChart = new Chart(ctx, {
      type: 'bar',
      data: {
       labels: times,
       datasets: [{
           label: false,
           backgroundColor: 'rgba(70, 70, 225, 0.5)',
           borderColor: 'rgba(0, 0, 255, 0.3)',
           data: percipitation,
           yAxisID: 'percipitation'
       },{
         data: temperatures,
         type:'line',
         backgroundColor: 'rgb(0, 0, 000)',
         borderColor: 'rgb(225, 225, 225)',
         yAxisID: 'temperatures'
       }]
   },
   options:{
     scales:{
       yAxes: [{
               id: 'percipitation',
               type: 'linear',
               position: 'right',
               ticks:{
                 suggestedMax: 2,
                 suggestedMin:2,
                 stepSize: 1
               }
              }, {
               id: 'temperatures',
               type: 'linear',
               position: 'left',
               ticks:{
                stepSize: 3,
                beginAtZero: true
                    }
                  }]
          },

     maintainAspectRatio :false,
     legend:{
       display: false
     },
     tooltips:{
       enabled: false
     },
     animation:{
       duration: 0
     },
     elements:{
       point:{
         radius:0
       }
     }
   }
  });

}


getRequest = function(url, message){
  var xmlHttp = new XMLHttpRequest();
  return new Promise(function(resolve, reject){
    xmlHttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        resolve(JSON.parse(this.responseText), {"status":"done"});
      }
    }
  xmlHttp.open( "GET", url, true);
  xmlHttp.send( message );
  })
}
