import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map((fileName) => {
    const modelName = path.basename(fileName, path.extname(fileName));
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  });

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    if (model) {
      await model.deleteMany({});
      console.log(`Cleared data from ${modelName}`);
    } else {
      console.error(
        `Model ${modelName} not found. Please ensure the model name is correctly specified.`
      );
    }
  }
}

async function main() {
  // Create admin user first
  const adminPassword = await bcrypt.hash("admin123", 12);
  
  const adminUser = await prisma.users.upsert({
    where: { email: "admin@invenio.com" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@invenio.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Admin user created:", adminUser);

  const dataDirectory = path.join(__dirname, "seedData");

  const orderedFileNames = [
    "products.json",
    "expenseSummary.json",
    "sales.json",
    "salesSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    "users.json",
    "expenses.json",
    "expenseByCategory.json",
  ];

  await deleteAllData(orderedFileNames);

  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File ${fileName} not found, skipping...`);
      continue;
    }

    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = path.basename(fileName, path.extname(fileName));
    const model: any = prisma[modelName as keyof typeof prisma];

    if (!model) {
      console.error(`No Prisma model matches the file name: ${fileName}`);
      continue;
    }

    // Handle users data specially to hash passwords
    if (modelName === "users") {
      for (const data of jsonData) {
        const hashedPassword = await bcrypt.hash(data.password || "password123", 12);
        await model.create({
          data: {
            ...data,
            password: hashedPassword,
            role: data.role || "VIEWER",
            isActive: data.isActive !== undefined ? data.isActive : true,
          },
        });
      }
    } else {
      for (const data of jsonData) {
        await model.create({
          data,
        });
      }
    }

    console.log(`Seeded ${modelName} with data from ${fileName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });