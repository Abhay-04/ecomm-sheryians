export { cn } from "cn"

const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const rupeesAndPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// ₹2,999 for whole amounts, ₹19.99 otherwise
export function formatPrice(price) {
  return Number.isInteger(price) ? wholeRupees.format(price) : rupeesAndPaise.format(price)
}
