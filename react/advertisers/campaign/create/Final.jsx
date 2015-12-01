﻿module.exports = React.createClass({

    getInitialData: function() {
        return {
            loading: true, error: false, message: ''
        };
    },

    componentWillMount: function() {
        // Build data object from campaignData for 
        var cd = campaignData, data = {
            c_name: cd.name, a_type: cd.type, a_paytype: cd.payType, c_availibility: cd.available,
            ct_category: cd.category, ct_keywords: cd.ct_keywords.replace(", ", ',').replace(" ,", ','),
            ct_sites: cd.sites.join(','), a_requested: cd.requested, f_allocated: cd.allocated,
            f_autobid: cd.autobid, f_bid: cd.bid, f_daily: cd.dailyFunds, a_link: cd.link,
            a_title: cd.title, a_description: cd.description, a_media: cd.media,
            ut_genders: 0, ut_age: 0, ut_countries: "", ut_regions: ""
        };

        // If all values in cd.genders/cd.age are the same, ut_value = 0
        var gender = cd.genders[1], age = cd.age[1], allGenders = true, allAges = true;

        cd.genders.forEach(function (g) { if (g != gender) allGenders = false; });
        cd.age.forEach(function (a) { if (a != age) allAges = false; });

        if (!allGenders) {
            for (var i = 1; i < 5; i++) {
                if (cd.genders[i]) data.ut_genders += i + ','
            }
            data.ut_genders = data.ut_genders.substr(0, data.ut_genders.length - 1);
        }

        if (!allAges) {
            for (var i = 1; i < 8; i++) {
                if (cd.age[i]) data.ut_age += i + ','
            }
            data.ut_age = data.ut_age.substr(0, data.ut_age.length - 1);
        }

        // Build ut_countries and ut_regions
        if (cd.countriesRegions.indexOf('*') == 0) {
            data.ut_regions = data.ut_countries = '*';
        }
        else {
            cd.countriesRegions.split('|').forEach(function (cr) {
                // cr == US:CA,FL,OR,...
                var temp = cr.split(':');

                data.ut_countries += '|' + temp[0];
                data.ut_regions += '|' + temp[1];
            });

            // Remove '|' from beginning of strings
            data.ut_countries = data.ut_countries.substr(1);
            data.ut_regions = data.ut_regions.substr(1);
        }

        // Send campaign to API
        ajax({
            url: API + "advertisers/campaigns",
            data: data,
            method: "POST",
            dataType: "json",
            success: function (res) {
                res.loading = false;
                this.setState(res);
            }.bind(this)
        });
    },

    back: function() {
        this.props.step('-');
    },

    render: function () {
        if (!this.state.loading) {
            var back;
            if (this.state.error) {
                var type = "error", title = "Error!";
                back = <Button onClick={this.back}>Back</Button>
            }
            else {
                var type = "success", title = "Success!";
            }

            return (
                <div>
                    <Alert type={type} title={title}>{this.state.message}</Alert>

                    {back}
                </div>
            );
        }
        else {
            return (
                <h2>Creating campaign...</h2> 
            );
        }
    }

});