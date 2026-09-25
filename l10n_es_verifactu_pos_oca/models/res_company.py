from odoo import models


class ResCompany(models.Model):
    _inherit = "res.company"

    def _load_pos_data_fields(self, config):
        fields = super()._load_pos_data_fields(config)
        fields.append("verifactu_enabled")
        return fields
