﻿import db = require("../db");

/*
    fn returns info object which contains:
        base price for ad type-pay type in category
        competitors in category with ad/pay type
        average bid and highest bid
*/

// ** Set actual base prices for each ad category

export = (adType: number, payType: number, category: string, fn) => {

    var basePrice: number;

    // Determine basePrice for adType using payType
    switch (adType + '-' + payType) {
        case '1-1': basePrice = 0.05; break;  // text cpc
        case '1-2': basePrice = 0.005; break; // text cpv
        case '2-1': basePrice = 0.03; break;  // short cpc
        case '2-2': basePrice = 0.003; break; // short cpv
        case '3-1': basePrice = 0.15; break;  // image cpc
        case '3-2': basePrice = 0.01; break;  // image cpv
        case '4-2': basePrice = 0.03; break;  // video cpv
    }

    var categoryLevels: number = category.split('>').length;

    // Add to basePrice for each subcategory
    if (categoryLevels > 1)
        basePrice += basePrice * 0.05;
    if (categoryLevels > 2)
        basePrice += basePrice * 0.05;

    // Round base price to 6th decimal place
    basePrice = Number(Math.round(basePrice + 'e' + 6) + 'e-' + 6);

    var info = {
        base: basePrice,
        competitors: 0,
        average: basePrice,
        highest: basePrice
    };

    db(cn => {
        var sql: string = ""
            + "SELECT AVG(cost) as average, COUNT(cost) as competitors, MAX(cost) as highest "
            + "FROM ads WHERE ct_categories = ? AND ad_type = ? AND pay_type = ?";
        cn.query(sql, [category, adType, payType], (err, rows) => {
            cn.release();

            if (rows.length == 0) {
                fn(info);
                return;
            }
            
            info.competitors = rows[0].competitors;
            info.average = rows[0].average;
            info.highest = rows[0].highest;

            fn(info);
        });
    });

};