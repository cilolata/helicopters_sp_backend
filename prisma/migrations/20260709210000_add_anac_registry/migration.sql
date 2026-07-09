CREATE TABLE "anac_registry" (
  "registration" VARCHAR(8)   NOT NULL,
  "owner"        VARCHAR(300),
  "model"        VARCHAR(100),
  "operator"     VARCHAR(300),
  CONSTRAINT "anac_registry_pkey" PRIMARY KEY ("registration")
);
