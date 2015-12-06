﻿import db = require("../../lib/db");

export = {

    /*
        GET api/pub/sites
        RETURN
            { sites: string[] }
        DESCRIPTION
            Return all sites linked to pub campaigns
    */
    sites: (req, res) => {
        db(cn => cn.query("SELECT site FROM pubs", (err, rows) => {
            cn.release();

            var sites: string[] = [];
            for (var i: number = 0; i < rows.length; i++) {
                sites.push(rows[i].site);
            }

            res.json({ sites: sites });
        }));
    },

    /*
        GET api/pub/categories
        RETURN
            { categories: string[] }
        DESCRIPTION
            Return possible categories
    */
    categories: (req, res) => {
        res.json({ categories: require("../../lib/category/list") });
    },

    /*
        GET api/pub/info
        REQUIRED
            id: number
        DESCRIPTION
            Return public info regarding pub campaign
        RETURN
            { site: string }
    */
    info: (req, res) => {
        var sql: string = "SELECT site FROM pubs WHERE id = ?";

        db(cn => cn.query(sql, [req.query.id], (err, rows) => {
            cn.release();

            if (err || !rows.length)
                res.json({ site: "Unknown" });
            else
                res.json({ site: rows[0].site });
        }));
    }

};