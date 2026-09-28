# Frontend Improvements Implementation Plan

This plan details the steps to implement the requested UI/UX improvements across the TicketHive frontend.

## 1. HoldConfirmationPopUp.tsx
*   **Loading State on Proceed Button**: 
    *   Change `onProceedToPayment` prop type to allow returning a `Promise`.
    *   Introduce `isProceeding` state.
    *   Update the "Proceed to Payment" button's `onClick` to `await onProceedToPayment()` while showing a loading spinner inside the button. Disable the button while proceeding.

## 2. CheckoutPage.tsx
*   **Autofill Fix**: 
    *   Update the `useEffect` that monitors `authEmail` and `profile`. Ensure it reliably updates `customerDetails.firstName` and `lastName` if the fields are currently empty, handling cases where the profile data loads asynchronously after the initial render.
*   **Billing Details & Order Summary Box Heights**:
    *   Add `h-full` to both the left (Billing Details) and right (Order Summary) column container `div`s. CSS grid will stretch them to equal heights, and `h-full` will make the inner boxes fill that stretched height.
*   **Validation Error Display**:
    *   Instead of calling `setError` (which triggers a full-page error overlay), introduce a `validationError` state (or just rely on the existing `formErrors` object).
    *   Display a prominent inline error banner *above* the billing form when validation fails, keeping the form visible so the user can correct it.
*   **PayHere Loading State & Background Overlay**:
    *   Introduce `isProcessingPayment` state.
    *   Set to `true` when "Pay with PayHere" is clicked.
    *   When the PayHere modal launches, render a `fixed inset-0 z-50 bg-black/60` overlay with a loading spinner behind the modal.
    *   Dismiss the overlay if `window.payhere.onDismissed` or `onError` is triggered.
*   **Event Details in Order Summary**:
    *   Fetch `OrderResponse` via `GET /api/booking/orders/${orderId}` to retrieve the `ShowId` and `CategoryId`.
    *   Fetch all events via `GET /api/catalog/events` and find the event containing `ShowId`.
    *   Render a compact event banner, event name, show date/time, and category name inside the Order Summary box.
*   **Success Screen Ticket Display**:
    *   Once payment is confirmed, fetch the user's tickets via `GET /api/booking/tickets`.
    *   Filter the tickets by the current `orderId`.
    *   Render a styled horizontal ticket card (matching the site's aesthetics) showing the event banner, ticket code, and a small QR code directly on the success screen.

## 3. MyTicketsPage.tsx
*   **Event Details on Tickets**:
    *   Fetch all events via `GET /api/catalog/events` on mount.
    *   Map each ticket's `showId` to its corresponding event.
    *   Update the ticket card UI to display the event's small banner image, event name, and show date/time.
*   **Back Button Styling**:
    *   Update the back button to use absolute positioning on the top-left (or styled exactly like the back button in `EventDetail.tsx`: `bg-brand-white/90 backdrop-blur-md border-2 border-ink-black p-3 rounded-full`).
*   **Screen Height**:
    *   Ensure the page container properly utilizes `min-h-screen` and stretches the background color correctly, preventing the footer from floating midway up the screen if there are few tickets.

## Next Steps
Upon user approval, I will execute these changes sequentially, starting with the `HoldConfirmationPopUp.tsx` and `CheckoutPage.tsx` modifications.
