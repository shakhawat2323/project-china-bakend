import { prisma } from './src/shared/prisma.ts';

async function main() {
    try {
        // Find a user
        const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
        if (!user) {
            console.log("No customer found");
            return;
        }
        console.log("Customer ID:", user.id);

        // Find a product
        const product = await prisma.product.findFirst();
        if (!product) {
            console.log("No product found");
            return;
        }
        console.log("Product ID:", product.id);

        const userId = user.id;
        const productId = product.id;
        const quantity = 1;

        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            console.log("Creating cart...");
            cart = await prisma.cart.create({ data: { userId } });
        }

        console.log("Cart ID:", cart.id);

        const existingItem = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } }
        });

        if (existingItem) {
            console.log("Updating cart item...");
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            console.log("Creating cart item...");
            await prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity }
            });
        }

        console.log("Successfully added to cart!");
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
