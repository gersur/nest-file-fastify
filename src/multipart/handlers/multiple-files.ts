import { BadRequestException } from "@nestjs/common";
import { FastifyRequest } from "fastify";

import { UploadOptions } from "../options";
import { StorageFile } from "../../storage";
import { removeFilesFactory } from "../file";
import { getParts } from "../request";

export const handleMultipartMultipleFiles = async (
  req: FastifyRequest,
  fieldname: string,
  maxCount: number,
  options: UploadOptions,
) => {
  const parts = getParts(req, options);
  const body: Record<string, any> = {};

  const files: StorageFile[] = [];

  for await (const part of parts) {
    if (part.file) {
      if (part.fieldname !== fieldname) {
        throw new BadRequestException(
          `Field ${part.fieldname} doesn't allow files`,
        );
      }

      if (files.length + 1 > maxCount) {
        throw new BadRequestException(
          `Field ${part.fieldname} allows only ${maxCount} files`,
        );
      }

      files.push(await options.storage!.handleFile(part, req));
    } else {
      body[part.fieldname] = part.value;
    }
  }

  if (files.length === 0) {
    throw new BadRequestException(`Field ${fieldname} is required`);
  }

  return { body, files, remove: removeFilesFactory(options.storage!, files) };
};
