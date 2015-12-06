﻿var Button = require("../../../forms/Button");

module.exports = React.createClass({

    getInitialState: function() {
        return {
            clicks: 0, views: 0, earnings: 0,
            pending: 0, ads: "", loading: true
        };
    },

    componentWillMount: function() {
        var url = API + "publishers/campaigns/" + this.props.id + "/reports"
            + "?dates=" + (new Date().toISOString().substr(0, 10));

        ajax({
            url: url,
            dataType: "json",
            success: function(res) {
                res.loading = false;
                this.setState(res, function () { this.idToAd(); });
            }.bind(this)
        });
    },

    generateReport: function() {
        var dates = this.refs.start.value;
        if (this.refs.end.value != "")
            dates += '|' + this.refs.end.value;

        var url = API + "publishers/campaigns/" + this.props.id + "/reports"
            + "?dates=" + dates;

        ajax({
            url: url,
            dataType: "json",
            success: function(res) {
                this.setState(res, function () { this.idToAd(); });
            }.bind(this)
        });
    },

    // Take list of ad campaign ids:clicks and convert id to ad's title
    idToSite: function () {
        if (this.state.ads == "")
            return;

        var arr = this.ads.publishers.split(',');

        var convert = function (i) {
            // Looped through all ids, set state.ads
            if (arr[i] == undefined) {
                this.setState({ ads: arr.join(',') });
                return;
            }

            var temp = arr[i].split(':');

            ajax({
                url: API + "ad/info?id=" + temp[0],
                dataType: "json",
                success: function (res) {
                    arr[i] = res.title + ':' + temp[1];
                    convert(i++);
                }
            });
        };

        convert(0);
    },

    render: function() {
        if (this.state.loading)
            return <div></div>;

        var s = this.state;

        return(
            <div className="campaign-reports">
                <h3>Generate Report</h3>

                <label>Start Date</label>
                <input type="text" ref="start" defaultValue={new Date().toISOString().substr(0, 10)} />
                
                <label>End Date</label>
                <input type="text" ref="end" />

                <Button onClick={this.generateReport}>Generate</Button>

                <hr />

                <div className="report">
                    <h3>Statistics</h3>
                    <table className="statistics">
                        <tr>
                            <th>Clicks</th><td>{s.clicks}</td>
                        </tr>
                        <tr>
                            <th>Views</th><td>{s.views}</td>
                        </tr>
                        <tr>
                            <th>CTR</th><td>{s.clicks == 0 ? "0.00" : (s.clicks / s.views)}%</td>
                        </tr>
                    </table>

                    <h3>Earnings</h3>
                    <table className="earnings">
                        <tr>
                            <th>Pending</th><td>{'$' + s.pending}</td>
                        </tr>
                        <tr>
                            <th>Confirmed</th><td>{'$' + s.earnings}</td>
                        </tr>
                    </table>

                    <h3>Top Advertisements</h3>
                    <p>Advertisements your users are clicking most.</p>
                    <table className="top-advertisers">{
                        s.ads.split(',').map(function(ad) {
                            return(
                                <tr>
                                    <th>{ad.split(':')[0]}</th>
                                    <td>{ad.split(':')[1]}</td>
                                </tr>
                            );
                        })
                    }</table>
                </div>
            </div>
        );
}

});