- The post-install hook refreshes the tills on installation only: after
  upgrading the module, an already running till keeps its cached data until
  its own configuration changes.
- With a connection the server stamps its own time on the running order's
  date_order, so around the UTC day change, or with a skewed terminal clock,
  the ticket QR code may not match the registration.
- The amount in the ticket QR code is the order total, while the
  registration adjusts it by the taxes mapped as not included in it: the
  base of the exempt not subject ones goes down, and the quota of the
  withholdings -- negative -- pushes it up. They only differ when the
  order carries one of those taxes; working it out in the PoS would mean
  replicating the backend tax mapping in the frontend.
- On a PoS that does not issue simplified invoices the ticket carries no
  QR code, while the backend does register the sale, falling back to the
  PoS reference as its serial number.
- Implement cancelling simplified and complete invoices from the PoS
- Configure new chaining from PoS Config
- Factura simplificada cualificada (art. 7.2 y 7.3 ROF): capturar el NIF
  del cliente en el TPV para emitir un tique deducible
  (`FacturaSimplificadaArt7273`) y evitar así el canje posterior.
- Canje de varios tiques en una única factura F3. El modelo ya lo
  admite (AEAT permite hasta 1000 facturas sustituidas y el enlace
  `pos.order.account_move` es un uno a varios), pero falta el asistente:
  `action_pos_order_invoice` factura los pedidos de uno en uno.
