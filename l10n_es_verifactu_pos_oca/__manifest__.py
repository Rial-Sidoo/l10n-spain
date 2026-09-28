{
    "name": "Comunicación Veri*FACTU: TPV",
    "version": "19.0.1.0.0",
    "category": "Sales/Point Of Sale",
    "website": "https://github.com/OCA/l10n-spain",
    "author": "Factor Libre S.L., Alia Technologies, Odoo Community Association (OCA)",
    "license": "AGPL-3",
    "application": False,
    "installable": True,
    "depends": ["l10n_es_pos_oca", "l10n_es_verifactu_oca"],
    "post_init_hook": "post_init_hook",
    "assets": {
        "point_of_sale._assets_pos": [
            "l10n_es_verifactu_pos_oca/static/src/**/*",
        ],
        "web.assets_tests": [
            "l10n_es_verifactu_pos_oca/static/tests/tours/**/*",
        ],
    },
    "data": [
        "views/pos_order_view.xml",
    ],
}
