﻿import email = require("../../../lib/email");
import db = require("../../../lib/db");

export = {

    getAll: (req, res) => {

        // Return all publishers awaiting application review
        if (req.query.publishers) {
            db(connection => {
                connection.query("SELECT * FROM awaiting_publishers", (err, rows) => {
                    connection.release();
                    res.json({ publishers: rows });
                });
            });
        }

        // Return all ads awaiting approval
        if (req.query.ads) {
            db(connection => {
                connection.query("SELECT * FROM ads WHERE approved = 0", (err, rows) => {
                    connection.release();
                    res.json({ ads: rows });
                });
            });
        }

    },

    deny: (req, res) => {

        if (req.body.publisher) {
            // Send denial email to publisher
            email(req.body.email, "Publisher Application - Denied",
                "Your application was denied for the following reason: " + req.body.reason
            );

            db(connection => {
                // Delete application from awaiting_publishers
                connection.query("DELETE FROM awaiting_publishers WHERE user_id = ?", [req.body.publisher], (e, r) => {
                    connection.release();
                });
            });
        }
        else {
            // Send denial email to advertiser
            email(req.body.email, "Advertising Campaign - Denied",
                "Your campaign was denied for the following reason: " + req.body.reason
            );

            // Refund cost of advertisement - 10% (minimum $10)
            db(connection => {
                connection.query("SELECT funds, owner FROM ads WHERE id = ?", [req.body.advertiser], (err, rows) => {
                    var refund: number = 0;
                    var sql: string = "";

                    // Determine refund amount
                    if (rows[0].funds > 10) {
                        refund = (rows[0].funds * 0.10) < 10 ? 10 : rows[0].funds * 0.10
                        refund = rows[0].funds - refund;
                    }

                    try {
                        connection.beginTransaction(err => {
                            // Add refund to user's funds
                            sql = "UPDATE users SET ad_funds = ad_funds + ? WHERE user_id = ?";
                            connection.query(sql, [refund, rows[0].owner], (e, r) => {
                                if (e) connection.rollback(() => { throw e; });

                                // Move relevant data from ads -> ads_ended
                                sql = "INSERT INTO ads_ended SELECT "
                                + "id, name, pay_type, cost, autobid, available, approved, ad_type, ut_age, "
                                + "ut_countries, ut_regions, ut_genders, ct_categories, ct_keywords, ct_sites, info, owner "
                                + "FROM ads WHERE id = ?";
                                connection.query(sql, [req.body.advertiser], (e, r) => {
                                    if (e) connection.rollback(() => { throw e; });

                                    // Delete row from ads
                                    sql = "DELETE FROM ads WHERE id = ?";
                                    connection.query(sql, [req.body.advertiser], (e, r) => {
                                        if (e)
                                            connection.rollback(() => { connection.release(); throw e; });
                                        else {
                                            connection.commit(err => {
                                                if (e) connection.rollback(() => { throw e; });
                                                else connection.release();
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    }
                    catch (err) {
                        connection.release();
                        res.json({ error: true, message: err.toString() });
                    }
                });
            });
        }

    },

    approve: (req, res) => {

        if (req.body.publisher) {
            // Email user notice of approval
            email(req.body.email, "Publisher Application - Approved",
                "Congratulations, your application was approved! You can now login to your publisher's dashboard: "
                + "<a href='https://ads.xyfir.com/publishers/'>Publisher Dashboard</a>"
            );
            
            db(connection => {
                // Set publisher boolean to true in users
                connection.query("UPDATE users SET publisher = 1 WHERE user_id = ?", [req.body.publisher], (e, r) => {
                    // Delete application from awaiting_publishers
                    connection.query("DELETE FROM awaiting_publishers WHERE user_id = ?", [req.body.publisher], (e, r) => {
                        connection.release();
                    });
                });
            });
        }
        else {
            var campaign: string = "https://ads.xyfir.com/advertisers/campaign/" + req.body.advertisement;

            // Email user notice of approval
            email(req.body.email, "Advertising Campaign - Approved",
                "Congratulations, your advertising campaign was approved! View your campaign here: "
                + "<a href='" + campaign + "'>Your Approved Campaign</a>"
            );

            // Set approved bool to true in ads
            db(connection => {
                connection.query("UPDATE ads SET approved = 1 WHERE id = ?", [req.body.advertisement], (err, result) => {
                    connection.release();
                });
            });
        }

    }

};