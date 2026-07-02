import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';

type RequestWithCurrentUser = {
  currentUser?: CurrentUserView;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserView => {
    const request = context.switchToHttp().getRequest<RequestWithCurrentUser>();

    return request.currentUser as CurrentUserView;
  },
);
