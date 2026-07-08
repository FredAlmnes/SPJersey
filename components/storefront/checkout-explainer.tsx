// components/storefront/checkout-explainer.tsx
// Static post-payment explainer copy (PROD-07). No logic, no props, no state.

export function CheckoutExplainer() {
  return (
    <p className="text-base text-zinc-700 dark:text-zinc-300">
      Etter betaling får du en ordrebekreftelse på e-post. Sporingsnummer
      sender vi så snart varene er sendt fra leverandøren.
    </p>
  );
}
