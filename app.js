var baseURL = "https://waterdata.capitolregionwd.org/KiWIS/KiWIS?datasource=0&service=kisters&type=queryServices&request="

// var getStations = baseURL+"getStationList&format=tabjson"
var getParams = baseURL+"getParameterList&format=tabjson"
var getTS_names = baseURL + "getTimeseriesList&format=tabjson"

var script_ver = "KiWIS URL Builder 0.2"
d3.select('title').text(script_ver)

var wqm = false

function sort_list(list,type) {
    if (type=="dict") {
        let [first] = Object.keys(list)
        delete list[first]
        var sorted_dict = {}
        list["000_placeholder"] = "null"
        sorted_dict = Object.fromEntries(Object.entries(list).sort())
        
        return sorted_dict
    }
    else if (type=="array") {
        list[0] = "000_placeholder"
        var sorted_list = []
        sorted_list = list.sort()
        return sorted_list

    }
}


function get_ts_stations(x) {
    switch(x){
        case (1): var stationlist = "getStationList"
        wqm = false
        break;
        case (2): var stationlist = "getWqmStationList"
        wqm=true
        break;
    }
    d3.selectAll('#stationSelect').html("")
    d3.selectAll('.filter1').html("")
    d3.selectAll('.filter2').html("")
    d3.selectAll('.filter3').html("")
    d3.selectAll('#formatSelect').html("")
    d3.selectAll("#measuringProgramSelect").html("")
    d3.json(baseURL+stationlist+"&format=tabjson").then(data=>{
        // console.log(data)
        var stations = {}
        if (!wqm) {
            data.forEach(station=>{stations[station[0]]=station[2]})
        }
        else data.forEach(station=>{stations[station[0]]=station[1]})
        
        stations = sort_list(stations,"dict")
        // console.log(stations)
        // console.log(stations)
        d3.select("#stationSelect").append('select')
        d3.select("#stationSelect>select").attr('onchange','parameterSelect(this.value)')
        Object.entries(stations).forEach(([key,value])=>{
            d3.select("#stationSelect>select").append('option').text(key).property('value',value)
        })
        d3.select('#stationSelect>select>option').text("Select a Station")
    })
}


function parameterSelect(selection) {
    d3.selectAll('.filter1').html("")
    d3.selectAll('.filter2').html("")
    d3.selectAll('.filter3').html("")
    d3.selectAll('#formatSelect').html("")
    d3.selectAll("#measuringProgramSelect").html("")
    // console.log(selection)
    d3.select('#parameterSelect').append('select')
    if (wqm) {
        d3.select('#parameterSelect>select').attr("multiple","multiple")
        var station = "&station_no="
        getParams = baseURL+"getWqmParameterList&format=tabjson"
        d3.select('#parameterSelect>select').attr('onchange','measuringProgramSelect(this.value)')
    }
    else {var station = "&station_id="
        d3.select('#parameterSelect>select').attr('onchange','timeSeriesSelect(this.value)')
    }
    d3.json(getParams+station+selection).then(data=>{
        // console.log(data)
        var parameters = data.map(parameter=>parameter[4])
        parameters = sort_list(parameters,"array")
        // console.log(parameters)
        
        
        parameters.forEach(parameter=>{
            d3.select('#parameterSelect>select').append('option').text(parameter)
        })
        if (!wqm) {d3.select('#parameterSelect>select>option').text("Select a Parameter")}
        if (wqm) {d3.select('#parameterSelect>select>option').text("All Parameters")}
    })

}

function timeSeriesSelect(selection) {
    d3.select('.filter2').html("")
    d3.select('.filter3').html("")
    d3.selectAll('#formatSelect').html("")
    d3.selectAll("#measuringProgramSelect").html("")
    reset_values
    var station = d3.select('#stationSelect>select').property('value')
    // console.log(selection)
    var returnFields = "station_name,station_no,station_id,ts_id,ts_name,parametertype_id,parametertype_name,coverage"
    d3.json(getTS_names +"&station_id="+station+"&parametertype_name="+selection+"&returnfields="+returnFields).then(data=>{
        // console.log(data)
        var timeSeries = {}
        data.forEach(ts=>{timeSeries[ts[4]]=[ts[3],ts[7],ts[8]]})
        d3.select('#timeseriesSelect').append('select')
        d3.select('#timeseriesSelect>select').attr('onchange','dateRange(this.value)')
        timeSeries = sort_list(timeSeries,"dict")         
        Object.entries(timeSeries).forEach(([key,value])=>{
        d3.select("#timeseriesSelect>select").append('option').text(key).property('value',value[0]).attr('from',value[1]).attr('to',value[2])
        d3.select('#timeseriesSelect>select>option').text("Select a Timeseries")
        })
        // console.log(timeSeries)
    })
}
var from_value = ""
var to_value = ""
var ts_id = ""

function reset_values() {
    from_value = ""
    to_value = ""
    ts_id = ""
}
function from_select() {
    d3.selectAll('#formatSelect').html("")
    from_value = d3.select('#from').property('value')
    if (to_value && to_value>from_value) {
        outputFormat()
        // console.log(to)
    }
}
function to_select() {
    d3.selectAll('#formatSelect').html("")
    to_value = d3.select('#to').property('value')
    if (from_value && to_value>from_value) {
        outputFormat()
    }
}

function dateRange(ts) {
    ts_id = ts
    var from_pick = d3.select(`#timeseriesSelect>select>option[value="${ts_id}"]`).attr('from').split("T")[0]
    var to_pick = d3.select(`#timeseriesSelect>select>option[value="${ts_id}"]`).attr('to').split("T")[0]
    d3.select('#dateSelect').html("")
    d3.selectAll('#formatSelect').html("")
    // console.log(from_pick)
    d3.select('#dateSelect').append('p').text(`Data Coverage: ${from_pick} to ${to_pick}`)
    d3.select('#dateSelect').append('label').attr('for','from').text("Start Date")
    d3.select('#dateSelect').append('input').attr('type','date').attr('id','from').attr('min',from_pick).attr('max',to_pick)
    d3.select('#dateSelect').append('label').attr('for','to').text("End Date")
    d3.select('#dateSelect').append('input').attr('type','date').attr('id','to').attr('min',from_pick).attr('max',to_pick)
    d3.select('#from').on('change',from_select)
    d3.select('#to').on('change',to_select)
    
    
    
}

function wqmdateRange() {
    d3.select('#dateSelect').html("")
    d3.selectAll('#formatSelect').html("")
    d3.select('#dateSelect').append('label').attr('for','from').text("Start Date")
    d3.select('#dateSelect').append('input').attr('type','date').attr('id','from')
    d3.select('#dateSelect').append('label').attr('for','to').text("End Date")
    d3.select('#dateSelect').append('input').attr('type','date').attr('id','to')
    d3.select('#from').on('change',from_select)
    d3.select('#to').on('change',to_select)
    
    
    
}

function outputFormat() {
    d3.selectAll('#formatSelect').html("")
    var formats = {"HTML":"html","CSV":"csv","JSON":"dajson"}
    d3.select('#formatSelect').append('select')
    // d3.select('#formatSelect>select').attr('onchange','downloadButton(this.value)')         
    d3.select('#formatSelect>select').append('option').text("Select a Format")
    Object.entries(formats).forEach(([key,value])=>{
        d3.select("#formatSelect>select").append('option').text(key).property('value',value)
    })
    d3.select('#formatSelect>select').on('change',button)
    
    

}

// function downloadButton(format) {
//     d3.select('#downloadButton').append('button').attr('id','urlButton').text("Generate URL")
    
//     console.log(format)
// }
function button(){
    // format = d3.select('#formatSelect').property('value')
    d3.select('#urlButton').remove()
    d3.select('#formatSelect').append('button').attr('id','urlButton').text("Generate URL")
    d3.select('#urlButton').attr('onclick','url()')
    
    // d3.select('#url').append('p').text("URL")
}

function url() {
    var format = d3.select('#formatSelect>select').property('value')
    switch(wqm){
        case (false):
            var returnFields = "Timestamp,Value,Quality Code Name,Quality Code";
            var md_returnfields = "ts_name,parametertype_name,station_name,ts_unitname,station_latitude,station_longitude";
            var kiwisurl = `${baseURL}getTimeseriesValues&ts_id=${ts_id}&from=${from_value}&to=${to_value}&format=${format}&returnfields=${returnFields}&metadata=true&md_returnfields=${md_returnfields}&dateformat=yyyy-MM-dd HH:mm:ss&csvdiv=,`
            break
        case (true):
            if (format=="dajson") {format="tabjson"}
            var returnFields = "measuringprog_name,parametertype_name,station_name,timestamp,sample_timestamp,value,value_sign,value_quality,value_remark,unit_name,unit_symbol,method_name,sample_depth" 
            var station_no = d3.select("#stationSelect>select").property('value')
            const selected = document.querySelectorAll('#parameterSelect option:checked');
            var selectedArray = Array.from(selected).map(el => el.value)
            var param = ""
            if (selectedArray.includes("All Parameters")) {param = ""}
            else {param = `&parametertype_name=${selectedArray}`}
            // const param = `&parametertype_name=${Array.from(selected).map(el => el.value)}`
            // var param = d3.select('#parameterSelect>select').property('value')
            // console.log(param)
            var meas_prog = "&measuringprog_name=" + d3.select('#measuringProgramSelect>select').property('value')
            if (meas_prog == "&measuringprog_name=Any") {meas_prog = ""}
            var kiwisurl =`${baseURL}getWqmSampleValues&station_no=${station_no}${param}${meas_prog}&from=${from_value}&to=${to_value}&returnfields=${returnFields}&format=${format}&dateformat=yyyy-MM-dd HH:mm:ss&csvdiv=,&maxquality=120&orderby=timestamp`
 

            

    }    
    d3.select('#url').append('p').attr('class','kiwisURL').append('a').attr('href',kiwisurl).text(kiwisurl)
}

function clear_url() {
    d3.selectAll('.kiwisURL').remove()
}

function measuringProgramSelect() {

    d3.select('.filter2').html("")
    d3.select('.filter3').html("")
    d3.selectAll('#formatSelect').html("")
    d3.selectAll("#measuringProgramSelect").html("")
    reset_values
    var measuringPrograms = ['Any','Storm','Base','Snowmelt','Lake','Wetland']
    d3.select('#measuringProgramSelect').append('select').attr('onchange','wqmdateRange()')
    d3.select('#measuringProgramSelect>select').append('option').text("Select a Monitoring Program")
    measuringPrograms.forEach(program=>{
        d3.select('#measuringProgramSelect>select').append('option').text(program)
    })
}